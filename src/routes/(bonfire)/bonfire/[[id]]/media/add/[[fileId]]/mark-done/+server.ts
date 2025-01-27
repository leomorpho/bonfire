import { triplitHttpClient } from "$lib/server/triplit";
import { redirect } from "@sveltejs/kit";

export const PATCH = async ({ request, params, locals }): Promise<Response> => {
    try {
      const user = locals.user;
      if (!user) {
        redirect(302, '/login');
      }
  
      const { fileId } = params;
      if (!fileId) {
        return new Response('Missing file ID', { status: 400 });
      }
  
      // Update the `is_uploaded` field
      await triplitHttpClient.update('files', fileId, (file) => {
        file.is_uploaded = true;
      });
  
      return new Response(JSON.stringify({ message: 'File marked as uploaded' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error updating file status:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  };
  