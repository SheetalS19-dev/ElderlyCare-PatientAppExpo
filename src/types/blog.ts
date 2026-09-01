export interface BlogModel {
  id?: number | string;
  category?: number | string | null;
  category_name?: string;
  title?: string;
  description?: string;
  featured_image?: string;
  author?: number | string;
  author_name?: string;
  tags?: string;
  status?: number;
  comment_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlogCategoryModel {
  id?: number | string;
  name?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}
