'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Upload } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

// Define form schema
const formSchema = z.object({
  name: z.string().min(3, {
    message: 'Group name must be at least 3 characters.',
  }),
  description: z.string().optional(),
  // We would handle image upload separately
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

export default function CreateGroupPage() {
  const t = useTranslations('groups');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Initialize form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, you would:
      // 1. Upload the image to storage if imageFile exists
      // 2. Call your GraphQL mutation to create the group with the values
      console.log('Creating group with values:', values, 'Image file:', imageFile);
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(t('createSuccess'));
      router.push('/dashboard/groups');
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/dashboard/groups');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={handleCancel} 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('back')}
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('create')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Image Upload */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div 
                    className={`h-32 w-32 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                      imagePreview ? 'border-primary' : 'border-dashed border-muted-foreground'
                    }`}
                  >
                    {imagePreview ? (
                      <Image 
                        src={imagePreview} 
                        alt="Group avatar" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Users className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <label 
                    htmlFor="image-upload" 
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-sm"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">{t('uploadImage')}</span>
                  </label>
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Group Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameLabel')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('namePlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t('nameDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Group Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('descriptionLabel')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('descriptionPlaceholder')} 
                        className="resize-none min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t('descriptionDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('creating') : t('create')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 