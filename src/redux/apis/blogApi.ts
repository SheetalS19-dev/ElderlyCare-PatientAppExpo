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

    getBlogComments: builder.query({
      query: (blogId: string | number) => `${ApiEndpoints.getBlogCommentsUrl}/${blogId}`,
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        return [];
      },
      providesTags: (result: any, error: any, blogId: any) => [{ type: 'BlogComment', id: blogId }],
    }),

    getFaq: builder.query({
      query: () => ({
        url: ApiEndpoints.getFaqUrl,
      }),
      transformResponse: (res: any) => res?.data ?? res,
    }),

    saveBlogComment: builder.mutation({
      query: (body: { blog_id: string | number; name: string; email: string; comment: string }) => ({
        url: ApiEndpoints.saveBlogCommentUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result: any, error: any, { blog_id }: any) => [
        { type: 'Blog', id: blog_id },
        { type: 'BlogComment', id: blog_id },
      ],
    }),
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogCategoriesQuery,
  useGetBlogTagsQuery,
  useSearchBlogsQuery,
  useGetBlogDetailQuery,
  useGetBlogCommentsQuery,
  useGetFaqQuery,
  useSaveBlogCommentMutation,
} = blogApi as any;

export type { BlogModel, BlogCategoryModel };
