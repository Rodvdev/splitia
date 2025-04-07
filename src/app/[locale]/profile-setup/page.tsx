'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { User } from '@supabase/supabase-js';

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

// Define profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  currency: z.string(),
  language: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSetupPage() {
  const t = useTranslations('profile.setup');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // Initialize form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      currency: 'PEN',
      language: 'en',
    },
  });

  // Check if user is authenticated and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login if not authenticated
        router.push('/sign-in');
        return;
      }
      
      setUser(session.user);
      
      // Check if user has already completed profile setup
      try {
        const response = await fetch('/api/profile/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isComplete) {
            // If profile is already complete, redirect to dashboard
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
      }
    };
    
    checkAuth();
  }, [router, supabase]);

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
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // First upload image if exists
      let imageUrl = null;
      if (imageFile) {
        const { data: imageData, error: imageError } = await supabase.storage
          .from('profile-images')
          .upload(`${user.id}/${Date.now()}-${imageFile.name}`, imageFile);
        
        if (imageError) {
          throw new Error(`Error uploading image: ${imageError.message}`);
        }
        
        if (imageData) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(imageData.path);
          
          imageUrl = publicUrl;
        }
      }
      
      // Save profile data
      const response = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          image: imageUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile data');
      }
      
      toast.success(t('successMessage'));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error(t('errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              
              <div className="space-y-2">
                <FormLabel>{t('avatarLabel')}</FormLabel>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden">
                      <Image 
                        src={imagePreview} 
                        alt="Profile preview" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      id="profile-image"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profile-image')?.click()}
                      className="w-full"
                    >
                      {t('uploadAvatar')}
                    </Button>
                    <FormDescription>
                      {t('avatarDescription')}
                    </FormDescription>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('currency')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PEN">PEN - Peruvian Sol</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                        <SelectItem value="MXN">MXN - Mexican Peso</SelectItem>
                        <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
                        <SelectItem value="CLP">CLP - Chilean Peso</SelectItem>
                        <SelectItem value="COP">COP - Colombian Peso</SelectItem>
                        <SelectItem value="ARS">ARS - Argentine Peso</SelectItem>
                        <SelectItem value="BOB">BOB - Bolivian Boliviano</SelectItem>
                        <SelectItem value="UYU">UYU - Uruguayan Peso</SelectItem>
                        <SelectItem value="PYG">PYG - Paraguayan Guarani</SelectItem>
                        <SelectItem value="VES">VES - Venezuelan Bolívar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('currencyDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('language')}</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Force redirect to the same page with new locale
                        const currentPath = window.location.pathname;
                        const pathParts = currentPath.split('/');
                        
                        if (pathParts.length > 1) {
                          // Replace locale segment
                          pathParts[1] = value;
                          // Manually navigate to the new URL
                          window.location.href = pathParts.join('/');
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('languageDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
          >
            {t('skip')}
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 