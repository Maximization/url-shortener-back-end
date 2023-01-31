export default (shortURL) => {
  return {
    id: shortURL.id,
    originalURL: shortURL.original_url,
    visitCount: shortURL.visit_count,
  };
};
