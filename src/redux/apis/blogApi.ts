import { baseApi } from './baseApi';
import { ApiEndpoints } from '../../constants';
import { BlogModel, BlogCategoryModel } from '../../types';

export const blogApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getBlogs: builder.query({
      query: () => ApiEndpoints.getBlogsUrl,
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.result)) return res.result;
        return [];
      },
      providesTags: ['Blog'],
    }),

    getBlogCategories: builder.query({
      query: () => ApiEndpoints.getBlogCategoriesUrl,
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.result)) return res.result;
        return [];
      },
      providesTags: ['BlogCategory'],
    }),

    getBlogTags: builder.query({
      query: () => ApiEndpoints.getBlogTagsUrl,
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.result)) return res.result;
        return [];
      },
      providesTags: ['BlogTag'],
    }),

    searchBlogs: builder.query({
      query: (params?: { page?: number; limit?: number; search_query?: string; category_id?: string | number; tag?: string }) => ({
        url: ApiEndpoints.getBlogSearchUrl,
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...params,
        },
      }),
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return { data: res };
        if (Array.isArray(res?.data)) return { data: res.data, meta: res.meta };
        return { data: [], meta: null };
      },
      providesTags: ['Blog'],
    }),

    getBlogDetail: builder.query({
      query: (id: string | number) => `${ApiEndpoints.getBlogDetailUrl}/${id}`,
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: (result: any, error: any, id: any) => [{ type: 'Blog', id }],
    }),

    getFaq: builder.query({
      query: () => ({
        url: 'https://new.elderlycare.life/page/faq',
      }),
      transformResponse: (res: any) => res?.data ?? res,
    }),
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogCategoriesQuery,
  useGetBlogTagsQuery,
  useSearchBlogsQuery,
  useGetBlogDetailQuery,
  useGetFaqQuery,
} = blogApi as any;

export type { BlogModel, BlogCategoryModel };
