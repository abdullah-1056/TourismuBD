export function combineShopProducts(catalog, posts) {
  return [...catalog, ...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function searchShopProducts(products, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return products;
  return products.filter((product) => `${product.name} ${product.description || ""} ${product.businesses?.business_name || ""} ${product.businesses?.district || ""}`.toLowerCase().includes(needle));
}
