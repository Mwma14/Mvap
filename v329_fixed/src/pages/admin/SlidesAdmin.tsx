import { useState } from 'react';
import { Image, Trash2, Save, Loader2, GripVertical, Eye, EyeOff, Link } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useAllInfoSlides,
  useCreateInfoSlide,
  useUpdateInfoSlide,
  useDeleteInfoSlide,
} from '@/hooks/useInfoSlides';
import SlideImageUpload from '@/components/admin/SlideImageUpload';

const BG_COLOR_OPTIONS = [
  { label: 'Red', value: 'from-red-600 to-red-800' },
  { label: 'Blue', value: 'from-blue-600 to-blue-800' },
  { label: 'Purple', value: 'from-purple-600 to-purple-800' },
  { label: 'Green', value: 'from-emerald-600 to-emerald-800' },
  { label: 'Amber', value: 'from-amber-600 to-amber-800' },
  { label: 'Pink', value: 'from-pink-600 to-pink-800' },
  { label: 'Cyan', value: 'from-cyan-600 to-cyan-800' },
];

export default function SlidesAdmin() {
  const { data: slides, isLoading } = useAllInfoSlides();
  const createSlide = useCreateInfoSlide();
  const updateSlide = useUpdateInfoSlide();
  const deleteSlide = useDeleteInfoSlide();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    redirect_link: '',
    bg_color: 'from-red-600 to-red-800',
    accent_color: 'text-yellow-300',
    display_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      image_url: '',
      redirect_link: '',
      bg_color: 'from-red-600 to-red-800',
      accent_color: 'text-yellow-300',
      display_order: (slides?.length ?? 0) + 1,
      is_active: true,
    });
    setEditingId(null);
  };

  const handleEdit = (slide: any) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title || '',
      description: slide.description || '',
      image_url: slide.image_url || '',
      redirect_link: slide.redirect_link || '',
      bg_color: slide.bg_color,
      accent_color: slide.accent_color,
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
    // Scroll to form on mobile so user sees the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSaveDisabled = !form.image_url || !form.redirect_link || createSlide.isPending || updateSlide.isPending;

  const handleSave = () => {
    const payload = {
      ...form,
      title: form.title || null,
      image_url: form.image_url || null,
      description: form.description || null,
      redirect_link: form.redirect_link,
    };

    if (editingId) {
      updateSlide.mutate({ id: editingId, ...payload }, { onSuccess: resetForm });
    } else {
      createSlide.mutate(payload as any, { onSuccess: resetForm });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
        <Image className="w-5 h-5 sm:w-8 sm:h-8" />
        Carousel Slides
      </h1>

      {/* Form */}
      <Card className="glass border-primary/30">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-base sm:text-lg">
            {editingId ? 'Edit Slide' : 'Add New Slide'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:px-6">
          {/* Image (required) */}
          <div className="space-y-2">
            <Label className="text-sm">Image <span className="text-destructive">*</span></Label>
            <SlideImageUpload
              imageUrl={form.image_url}
              onImageChange={(url) => setForm({ ...form, image_url: url })}
            />
          </div>

          {/* Redirect Link (required) */}
          <div className="space-y-2">
            <Label className="text-sm">Redirect Link <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={form.redirect_link}
                onChange={(e) => setForm({ ...form, redirect_link: e.target.value })}
                placeholder="https://example.com or /movies/123"
                className="text-sm"
              />
            </div>
          </div>

          {/* Title (optional) */}
          <div className="space-y-2">
            <Label className="text-sm">Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Slide title..."
              className="text-sm"
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label className="text-sm">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Slide description..."
              className="text-sm min-h-[80px]"
            />
          </div>

          {/* Background color fallback */}
          {!form.image_url && (
            <div className="space-y-2">
              <Label className="text-sm">Background Color</Label>
              <div className="flex flex-wrap gap-2">
                {BG_COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, bg_color: opt.value })}
                    className={`px-3 py-1.5 rounded-lg text-xs text-white font-medium bg-gradient-to-r ${opt.value} ${
                      form.bg_color === opt.value ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Display Order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                className="text-sm"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label className="text-sm">Active</Label>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm">Preview</Label>
            <div className={`relative rounded-lg overflow-hidden min-h-[120px] flex ${
              form.image_url ? '' : `bg-gradient-to-br ${form.bg_color}`
            }`}>
              {form.image_url && (
                <>
                  <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                </>
              )}
              <div className="relative z-10 p-4 flex flex-col justify-center">
                {form.title && (
                  <h3 className="text-base font-bold text-white">{form.title}</h3>
                )}
                {form.description && (
                  <p className={`text-sm mt-1 ${form.image_url ? 'text-white/90' : form.accent_color}`}>
                    {form.description}
                  </p>
                )}
                {form.redirect_link && (
                  <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
                    <Link className="w-3 h-3" /> {form.redirect_link}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="flex-1"
              size="sm"
            >
              {(createSlide.isPending || updateSlide.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingId ? 'Update Slide' : 'Add Slide'}
            </Button>
            {editingId && (
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing Slides */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Current Slides ({slides?.length ?? 0})
        </h2>
        {slides?.map((slide) => (
          <Card key={slide.id} className={`border border-border bg-card ${!slide.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-xs font-mono">#{slide.display_order}</span>
                </div>

                {/* Thumbnail */}
                <div className={`w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ${
                  slide.image_url ? '' : `bg-gradient-to-br ${slide.bg_color}`
                }`}>
                  {slide.image_url ? (
                    <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold px-1 text-center">{(slide.title || 'Slide').slice(0, 15)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate">{slide.title || 'No title'}</h3>
                    {slide.is_active ? (
                      <Eye className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {slide.redirect_link && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                      <Link className="w-3 h-3 shrink-0" /> {slide.redirect_link}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 shrink-0 relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(slide);
                    }}
                    className="h-10 px-3 text-xs touch-manipulation"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSlide.mutate(slide.id);
                    }}
                    disabled={deleteSlide.isPending}
                    className="h-10 px-3 touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!slides || slides.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No slides yet. Add your first slide above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
