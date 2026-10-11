export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/menu') return env.ASSETS.fetch(request);
    const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    if (request.method !== 'GET') return new Response(JSON.stringify({error:'Método no permitido'}),{status:405,headers});
    try {
      const response = await fetch('https://garibaldi-api.alexijoseg87.workers.dev/menu',{signal:AbortSignal.timeout(25000)});
      return new Response(response.body,{status:response.status,headers});
    } catch {
      return new Response(JSON.stringify({error:'No se pudo actualizar el menú desde Loyverse'}),{status:502,headers});
    }
  }
};
