/**
 * Cart-level order routing helpers.
 *
 * Email checkout when ALL of these are true:
 * 1. Every item is an email-eligible product type (frame/sunglasses)
 * 2. No actual prescription/extra lens is selected on any item
 *
 * Important: a product SUPPORTING lenses (with "No Lens Selected") is still email-eligible.
 */

export function normalizeCategoryName(name) {
  return (name || '').toLowerCase().trim();
}

export function getActualProductCategory(itemOrProduct) {
  const product = itemOrProduct?.product ?? itemOrProduct;

  if (itemOrProduct?.categoryName) {
    return normalizeCategoryName(itemOrProduct.categoryName);
  }

  const categories = product?.categories;

  if (Array.isArray(categories)) {
    const name = categories[0]?.name;
    if (name) return normalizeCategoryName(name);
  } else if (categories?.name) {
    return normalizeCategoryName(categories.name);
  }

  if (product?.category?.name) {
    return normalizeCategoryName(product.category.name);
  }

  if (typeof product?.category_name === 'string') {
    return normalizeCategoryName(product.category_name);
  }

  return '';
}

export function getProductCategorySnapshot(product) {
  const categories = product?.categories;

  if (Array.isArray(categories)) {
    return categories[0]?.name || '';
  }

  return categories?.name || product?.category?.name || product?.category_name || '';
}

/** Categories that always require WhatsApp regardless of lens selection. */
export function isWhatsAppOnlyCategory(category) {
  const normalized = normalizeCategoryName(category);
  if (!normalized) return false;

  return (
    normalized.includes('contact') ||
    normalized.includes('screen') ||
    normalized.includes('intelligent')
  );
}

/** Men's / Women's are browsing categories — frames there use purchase_method to qualify. */
export function isGenderShopCategory(category) {
  const normalized = normalizeCategoryName(category);
  if (!normalized) return false;

  return (
    normalized === "men's" ||
    normalized === 'mens' ||
    normalized === "women's" ||
    normalized === 'womens'
  );
}

export function isSunglassesOrFrameCategory(category) {
  const normalized = normalizeCategoryName(category);
  if (!normalized) return false;

  return (
    normalized === 'sunglasses' ||
    normalized === 'frame' ||
    normalized === 'frames' ||
    normalized === 'eyeglasses' ||
    normalized === 'eyeglass' ||
    normalized.includes('sunglasses') ||
    normalized.includes('frame') ||
    normalized.includes('eyeglass')
  );
}

/**
 * Whether a single cart item can use email checkout (ignoring lens — checked separately).
 */
export function isEmailEligibleProduct(item) {
  const product = item?.product ?? item;
  const category = getActualProductCategory(item);

  if (isWhatsAppOnlyCategory(category)) {
    return false;
  }

  if (isSunglassesOrFrameCategory(category)) {
    return true;
  }

  // Frame/sunglasses listed under Men's or Women's with optional lenses in admin
  if (isGenderShopCategory(category) && product?.purchase_method === 'direct_order') {
    return true;
  }

  return false;
}

export function hasActualLensSelected(item) {
  const lens = item?.selectedLens ?? item?.lens_details ?? null;
  if (!lens) return false;

  if (lens.id === 'no-lens-default') return false;
  if (lens.name === 'No Lens Selected') return false;
  if (typeof lens.id === 'string' && lens.id.startsWith('no-lens')) return false;

  return true;
}

export function evaluateCartOrderRouting(cartItems) {
  const allProductsAreSunglassesOrFrames =
    cartItems.length > 0 &&
    cartItems.every((item) => isEmailEligibleProduct(item));

  const noLensSelectedAnywhere = cartItems.every((item) => !hasActualLensSelected(item));

  const useEmailConfirmation = allProductsAreSunglassesOrFrames && noLensSelectedAnywhere;

  return {
    allProductsAreSunglassesOrFrames,
    noLensSelectedAnywhere,
    useEmailConfirmation,
  };
}

export function logCartRoutingDebug(cartItems, routing) {
  if (!import.meta.env.DEV) return;

  console.group('[Cart Order Routing Debug]');
  cartItems.forEach((item, index) => {
    console.log(`Item ${index + 1}:`, {
      productName: item.product?.name,
      category: getActualProductCategory(item),
      purchaseMethod: item.product?.purchase_method,
      isEmailEligibleProduct: isEmailEligibleProduct(item),
      selectedLens: item.selectedLens,
      selectedColor: item.selectedColor,
      hasActualLensSelected: hasActualLensSelected(item),
    });
  });
  console.log('Routing results:', routing);
  console.groupEnd();
}
