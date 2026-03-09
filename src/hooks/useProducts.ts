import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Product, ProductType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateProductData {
  name: string;
  sku: string;
  description?: string;
  type: ProductType;
  hsn_code?: string;
  selling_price: number;
  tax_rate?: number;
  stock_quantity: number;
  low_stock_limit: number;
}

const EMPTY_ARRAY: any[] = [];

export function useProducts() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return EMPTY_ARRAY;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('profile_id', profile.id)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!profile?.id,
  });

  const products = productsQuery.data || EMPTY_ARRAY;

  const lowStockProducts = useMemo(() =>
    products.filter((p) => p.type === 'goods' && p.stock_quantity <= p.low_stock_limit),
    [products]
  );

  const createProduct = useMutation({
    mutationFn: async (product: CreateProductData) => {
      if (!profile?.id) throw new Error('No profile');
      
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, profile_id: profile.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product created', description: 'Product added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product updated', description: 'Changes saved successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted', description: 'Product removed successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return useMemo(() => ({
    products,
    lowStockProducts,
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProduct,
    updateProduct,
    deleteProduct,
  }), [products, lowStockProducts, productsQuery.isLoading, productsQuery.error, createProduct, updateProduct, deleteProduct]);
}
