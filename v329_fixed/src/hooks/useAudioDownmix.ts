/**
 * useAudioDownmix
 *
 * Connects a <video> element to the Web Audio API and applies a
 * 5.1-to-stereo downmix matrix so that the centre channel (dialogue)
 * is always audible on stereo devices.
 *
 * Standard 5.1 channel layout (as used by AC3 / EAC3 / DTS):
 *   0 = Front Left   (FL)
 *   1 = Front Right  (FR)
 *   2 = Front Centre (FC)  ← this is the voice channel
 *   3 = LFE (subwoofer)
 *   4 = Surround Left  (SL)
 *   5 = Surround Right (SR)
 *
 * ITU-R BS.775 downmix coefficients (simplified, -3 dB centre):
 *   Left  out = FL + FC*0.707 + SL*0.707
 *   Right out = FR + FC*0.707 + SR*0.707
 *
 * For 2-channel (stereo) sources this is a no-op pass-through.
 * For mono sources the single channel is sent to both outputs.
 */

import { useEffect, useRef } from 'react';

// Shared AudioContext — browsers allow only a limited number
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function useAudioDownmix(
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean = true
) {
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const channelMergerRef = useRef<ChannelMergerNode | null>(null);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    // We must wait until the video has loaded enough metadata to know
    // how many audio channels the stream actually has.
    const applyDownmix = () => {
      if (connectedRef.current) return; // already wired up

      const ctx = getAudioContext();
      if (!ctx) return;

      // Resume context if suspended (required by autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      try {
        // Create the source node from the video element.
        // Each video element can only have ONE MediaElementSourceNode.
        if (!sourceNodeRef.current) {
          sourceNodeRef.current = ctx.createMediaElementSource(video);
        }
        const source = sourceNodeRef.current;
        const numChannels = source.channelCount;

        if (numChannels <= 2) {
          // Stereo or mono — connect directly, no processing needed
          source.connect(ctx.destination);
          connectedRef.current = true;
          return;
        }

        // ---- 5.1 (6-channel) downmix to stereo ----
        // Split the 6 input channels
        const splitter = ctx.createChannelSplitter(numChannels);
        splitterRef.current = splitter;

        // Merge back into 2 output channels
        const merger = ctx.createChannelMerger(2);
        channelMergerRef.current = merger;

        // Master gain (slight boost to compensate for downmix attenuation)
        const gain = ctx.createGain();
        gainNodeRef.current = gain;
        gain.gain.value = 1.2;

        // --- LEFT output (merger input 0) ---
        // FL (ch 0) → Left
        const gainFL_L = ctx.createGain(); gainFL_L.gain.value = 1.0;
        splitter.connect(gainFL_L, 0); gainFL_L.connect(merger, 0, 0);

        // FC (ch 2) → Left at -3 dB (0.707)
        const gainFC_L = ctx.createGain(); gainFC_L.gain.value = 0.707;
        splitter.connect(gainFC_L, 2); gainFC_L.connect(merger, 0, 0);

        // SL (ch 4) → Left at -3 dB
        const gainSL_L = ctx.createGain(); gainSL_L.gain.value = 0.707;
        splitter.connect(gainSL_L, 4); gainSL_L.connect(merger, 0, 0);

        // LFE (ch 3) → Left at low level (optional, subtle)
        const gainLFE_L = ctx.createGain(); gainLFE_L.gain.value = 0.1;
        splitter.connect(gainLFE_L, 3); gainLFE_L.connect(merger, 0, 0);

        // --- RIGHT output (merger input 1) ---
        // FR (ch 1) → Right
        const gainFR_R = ctx.createGain(); gainFR_R.gain.value = 1.0;
        splitter.connect(gainFR_R, 1); gainFR_R.connect(merger, 0, 1);

        // FC (ch 2) → Right at -3 dB
        const gainFC_R = ctx.createGain(); gainFC_R.gain.value = 0.707;
        splitter.connect(gainFC_R, 2); gainFC_R.connect(merger, 0, 1);

        // SR (ch 5) → Right at -3 dB
        const gainSR_R = ctx.createGain(); gainSR_R.gain.value = 0.707;
        splitter.connect(gainSR_R, 5); gainSR_R.connect(merger, 0, 1);

        // LFE (ch 3) → Right at low level
        const gainLFE_R = ctx.createGain(); gainLFE_R.gain.value = 0.1;
        splitter.connect(gainLFE_R, 3); gainLFE_R.connect(merger, 0, 1);

        // Chain: source → splitter (already connected above) → merger → gain → destination
        source.connect(splitter);
        merger.connect(gain);
        gain.connect(ctx.destination);

        connectedRef.current = true;
        console.log(`[AudioDownmix] Applied 5.1→stereo downmix (${numChannels} channels detected)`);
      } catch (err) {
        console.warn('[AudioDownmix] Could not apply downmix, falling back to default:', err);
        // Fallback: connect source directly so audio still works
        try {
          if (sourceNodeRef.current) {
            sourceNodeRef.current.connect(getAudioContext()!.destination);
          }
        } catch {}
        connectedRef.current = true;
      }
    };

    // Try immediately (in case metadata is already loaded)
    if (video.readyState >= 1) {
      applyDownmix();
    }

    // Also hook into loadedmetadata for late-loading streams
    video.addEventListener('loadedmetadata', applyDownmix);
    // Resume AudioContext on first user interaction (autoplay policy)
    const resumeCtx = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    video.addEventListener('play', resumeCtx);

    return () => {
      video.removeEventListener('loadedmetadata', applyDownmix);
      video.removeEventListener('play', resumeCtx);
      // NOTE: We intentionally do NOT disconnect the source node here because
      // MediaElementAudioSourceNode cannot be re-created for the same element.
      // The connection persists for the lifetime of the video element.
    };
  }, [videoRef, enabled]);
}
