import { Mail } from 'lucide-react';

// Custom Telegram icon
export const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// Custom Viber icon - speech bubble with phone waves
export const ViberIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.398.002C9.47.028 5.192.344 3.187 2.225 1.558 3.85.9 6.188.832 9.112.764 12.04.632 17.57 5.61 18.9h.002l-.004 2.256s-.037.913.567 1.097c.734.227 1.165-.47 1.87-1.217l1.287-1.442c3.393.288 6.027-.37 6.324-.47.685-.23 4.555-.717 5.186-5.857.65-5.31-.315-8.67-2.07-10.197l.004-.003c-.438-.39-2.19-1.624-6.326-1.834-.004 0-.68-.042-1.052-.032zm.148 1.952c.292-.003.573.006.87.025 3.424.176 4.875 1.14 5.237 1.47 1.406 1.23 2.193 4.08 1.64 8.547-.506 4.12-3.487 4.37-4.063 4.565-.247.08-2.472.64-5.306.476 0 0-2.104 2.534-2.76 3.195-.103.103-.222.146-.302.125-.113-.028-.144-.16-.143-.354.002-.27.016-3.362.016-3.362-4.01-1.065-3.788-5.478-3.73-7.896.05-2.418.563-4.377 1.838-5.636 1.62-1.5 5.404-1.842 6.703-1.853v-.002zm-.046 1.865a.508.508 0 0 0-.53.478.506.506 0 0 0 .478.532c1.238.067 2.262.39 3.045 1.013.85.676 1.313 1.62 1.377 2.806.016.28.253.496.533.48a.507.507 0 0 0 .48-.534c-.082-1.47-.678-2.685-1.77-3.555-.962-.767-2.222-1.16-3.613-1.218a.508.508 0 0 0-.02-.002zm-2.067.91c-.157-.003-.31.064-.43.186l-.002.004-.002.002c-.27.286-.53.577-.79.865-.19.21-.262.455-.21.69.44 1.92 1.22 3.662 2.4 5.167 1.135 1.45 2.53 2.61 4.165 3.45.268.14.554.105.76-.093.305-.288.606-.58.897-.875.2-.21.206-.5.043-.718-.516-.69-1.076-1.34-1.705-1.93-.207-.197-.502-.195-.722-.01l-.56.488c-.15.13-.352.147-.505.054l-.01-.004c-.358-.188-.69-.406-1.003-.653a10.453 10.453 0 0 1-2.01-2.236c-.153-.23-.133-.508.057-.695.173-.167.34-.345.507-.52l.005-.006c.172-.18.21-.427.1-.653a20.91 20.91 0 0 0-.916-1.87c-.11-.193-.313-.32-.546-.37a.662.662 0 0 0-.124-.016.91.91 0 0 0-.1-.005zm2.084.482a.508.508 0 0 0-.072 1.013c.6.085 1.09.31 1.46.668.368.357.598.855.682 1.47a.508.508 0 0 0 1.006-.134c-.114-.845-.437-1.565-1.003-2.116-.565-.55-1.302-.84-2.07-.902h-.003zm.032 1.618a.508.508 0 0 0-.09 1.008c.243.044.407.132.49.217.082.085.137.183.16.358a.506.506 0 0 0 .565.44.508.508 0 0 0 .44-.565c-.055-.418-.21-.798-.523-1.117-.312-.32-.702-.502-1.042-.54z"/>
  </svg>
);

interface ContactIconsProps {
  telegramUrl?: string;
  viberUrl?: string;
  emailUrl?: string;
  size?: 'sm' | 'md';
}

export function ContactIcons({ 
  telegramUrl = 'https://t.me/onedove',
  viberUrl = 'viber://chat?number=09883249943',
  emailUrl = 'mailto:thewaymmofficial@gmail.com?subject=Premium%20Subscription%20Inquiry',
  size = 'md'
}: ContactIconsProps) {
  const iconSize = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  const innerIconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <div className="flex items-center justify-center gap-4">
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${iconSize} rounded-full bg-[#0088cc] flex items-center justify-center hover:scale-110 transition-transform`}
        title="Telegram"
      >
        <TelegramIcon className={`${innerIconSize} text-white`} />
      </a>
      <a
        href={viberUrl}
        className={`${iconSize} rounded-full bg-[#7360f2] flex items-center justify-center hover:scale-110 transition-transform`}
        title="Viber"
      >
        <ViberIcon className={`${innerIconSize} text-white`} />
      </a>
      <a
        href={emailUrl}
        className={`${iconSize} rounded-full bg-[#EA4335] flex items-center justify-center hover:scale-110 transition-transform`}
        title="Gmail"
      >
        <Mail className={`${innerIconSize} text-white`} />
      </a>
    </div>
  );
}
