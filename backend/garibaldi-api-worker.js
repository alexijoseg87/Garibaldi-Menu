const allowed = new Set(["Agua 500ml","Banderillas picantes","Café Bombón","Café Capuchino","Café Expreso","Caipirisima","Caipirosca","Calzon Supremo","Cerv La Fria","Cerveza Beer Botella","Cerveza Bucanero","Cerveza Mayabe","Cerveza Windmill","Chicharrita de plátano","Chuleta Ahumada","Colada Oreo","Cortadito","Costillas al Plato","Cristal de Botella","Cristal Extra","Cristal Extra Botella","Cristal Lata","Croqueticas","Cuba Libre","Daikiri","Destornillador","Ensalada Fria","Entremés mixto","Espagueti queso gouda","Flan","Frapuchino","Hamb Cerdo","Hamb Cerdo JQ","Hamb Doble","Hamb Garibaldi","Hamb Hawaiana","Hamb Pollo","Hamb Pollo JQ","Jugo de Coctel 250 ml","Jugo de Pera 200 ml","Jugo de Piña Bravo","Jugo de Piña Natural","Jugo Manzana","Jugo Manzana lata","Jugo Pera lata","Jugo Piña lata","Laguna Azul","Limonada Frape","Malta","Malta Bucanero","Malteada","Maxmato","Mocha Frapuchino","Piña Colada","Pizza Bacon","Pizza de Atún","Pizza de Queso Gouda","Pizza FamGaribaldi","Pizza Garibaldi","Pizza Hawaiana","PizzaFamQ Blanco","PizzaFamQ Gouda","Pizzagueti Queso Gouda","Refresco Cola","Refresco Limon","Refresco Naranja","Refresco piña","Sangria","shot tequila","shot tequila azul","Spirit Gin Tonic","Spirit Naranja Vodka","Tapa de Aceitunas","Tigon","Tinto de Verano","Tiritas de Cerdo"].map(normalize));
function normalize(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase(); }
let cached, expires = 0;
async function list(resource, token) {
  const rows = []; let cursor;
  do {
    const url = new URL('https://api.loyverse.com/v1.0/' + resource);
    url.searchParams.set('limit', '250');
    if (cursor) url.searchParams.set('cursor', cursor);
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('LOYVERSE_' + response.status);
    const data = await response.json();
    rows.push(...(data[resource] || [])); cursor = data.cursor;
    if (rows.length > 10000) throw new Error('CATALOG_TOO_LARGE');
  } while (cursor);
  return rows;
}
async function catalog(env) {
  if (cached && Date.now() < expires) return cached;
  const pending = (async () => {
    const [items, categories, modifiers] = await Promise.all([list('items', env.LOYVERSE_TOKEN), list('categories', env.LOYVERSE_TOKEN), list('modifiers', env.LOYVERSE_TOKEN)]);
    const modifierGroups = modifiers.filter(m => !m.deleted_at).map(m => ({id:m.id, name:m.name, options:(m.modifier_options || []).filter(o => !o.deleted_at && typeof o.price === 'number' && Number.isFinite(o.price)).map(o => ({id:o.id,name:o.name,price:o.price}))}));
    const names = new Map(categories.filter(c => !c.deleted_at).map(c => [c.id, c.name]));
    const products = [];
    for (const item of items) {
      if (item.deleted_at || !allowed.has(normalize(item.item_name))) continue;
      const category = names.get(item.category_id) || 'Otros';
      for (const v of item.variants || []) {
        if (v.deleted_at) continue;
        const stores = (v.stores || []).filter(s => !env.LOYVERSE_STORE_ID || s.store_id === env.LOYVERSE_STORE_ID);
        if (stores.length && stores.every(s => s.available_for_sale === false)) continue;
        const store = stores.find(s => s.available_for_sale !== false);
        const pricing = store?.pricing_type || v.default_pricing_type;
        const price = store?.price ?? v.default_price;
        if (pricing !== 'FIXED' || typeof price !== 'number' || !Number.isFinite(price)) continue;
        const options = [v.option1_value,v.option2_value,v.option3_value].filter(Boolean).join(' / ');
        products.push({id:v.variant_id || v.id || item.id, image_url: typeof item.image_url === 'string' && item.image_url.startsWith('https://') ? item.image_url : null, modifier_groups: modifierGroups.filter(m => (item.modifiers_ids || []).includes(m.id)), name: item.item_name + (options ? ' · ' + options : ''), category, price, description: item.description || ''});
      }
    }
    products.sort((a,b) => a.name.localeCompare(b.name,'es'));
    cached = {products, modifier_groups: modifierGroups, updated_at: new Date().toISOString(), orders_enabled: false};
    expires = Date.now() + 60000;
    return cached;
  })();
  return await pending;
}
export default {
  async fetch(request, env) {
    const headers = {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'https://garibaldi-menu.pages.dev','Access-Control-Allow-Methods':'GET, OPTIONS','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    const send = (body,status=200) => new Response(JSON.stringify(body),{status,headers});
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (request.method !== 'GET') return send({error:'Método no permitido'},405);
    if (!['/','/menu','/api/menu'].includes(new URL(request.url).pathname)) return send({error:'No encontrado'},404);
    if (!env.LOYVERSE_TOKEN) return send({error:'Falta configurar Loyverse'},503);
    try { return send(await catalog(env)); }
    catch (error) { console.error('Catalog error:',error.message); return send({error:'No se pudo actualizar el menú desde Loyverse'},502); }
  }
};