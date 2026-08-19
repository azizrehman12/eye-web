import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import PurchaseButton from '../../components/shared/PurchaseButton';
import '../../styles/product-details.css';

const ProductDetails = () => {
  const { id } = useParams(); // Using 'id' param from router, but it's actually the slug based on the Link `to={`/products/${product.slug}`}`
  const slug = id;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductBySlug(slug);
        setProduct(data);
        const primaryImage = data.images?.find(img => img.is_primary) || data.images?.[0];
        setActiveImage(primaryImage ? primaryImage.image_url : '/placeholder-glasses.jpg');
      } catch (err) {
        console.error("Failed to fetch product", err);
        setError("Product not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return <div className="container section-padding text-center">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="container section-padding text-center">
        <h2>{error || 'Product not found'}</h2>
        <Link to="/products" className="btn btn--primary mt-2">Back to Shop</Link>
      </div>
    );
  }

  const hasSale = product.sale_price && product.sale_price < product.price;

  return (
    <div className="container section-padding">
      <div className="product-details">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="product-gallery__main">
            <img src={activeImage} alt={product.name} />
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="product-gallery__thumbnails">
              {product.images.map(img => (
                <div 
                  key={img.id} 
                  className={`product-gallery__thumb ${activeImage === img.image_url ? 'is-active' : ''}`}
                  onClick={() => setActiveImage(img.image_url)}
                >
                  <img src={img.image_url} alt="Thumbnail" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info">
          <span className="product-info__category">{product.categories?.name || 'Uncategorized'}</span>
          <h1 className="product-info__title">{product.name}</h1>
          
          <div className="product-info__price-box">
            {hasSale ? (
              <>
                <span className="product-info__sale-price">PKR {product.sale_price}</span>
                <span className="product-info__original-price">PKR {product.price}</span>
                <span className="badge badge--error">SALE</span>
              </>
            ) : (
              <span className="product-info__price">PKR {product.price}</span>
            )}
            
            {product.stock_quantity === 0 && (
              <span className="badge badge--error ml-auto">Out of Stock</span>
            )}
          </div>

          <div className="product-info__description">
            <p>{product.short_description || product.description}</p>
          </div>

          {/* Specifications */}
          <div className="product-specs">
            {product.brand && (
              <div className="spec-item">
                <span className="spec-item__label">Brand</span>
                <span className="spec-item__value">{product.brand}</span>
              </div>
            )}
            {product.sku && (
              <div className="spec-item">
                <span className="spec-item__label">SKU</span>
                <span className="spec-item__value">{product.sku}</span>
              </div>
            )}
            {product.gender && (
              <div className="spec-item">
                <span className="spec-item__label">Gender</span>
                <span className="spec-item__value">{product.gender}</span>
              </div>
            )}
            {product.frame_type && (
              <div className="spec-item">
                <span className="spec-item__label">Frame Type</span>
                <span className="spec-item__value">{product.frame_type}</span>
              </div>
            )}
            {product.frame_material && (
              <div className="spec-item">
                <span className="spec-item__label">Material</span>
                <span className="spec-item__value">{product.frame_material}</span>
              </div>
            )}
            {product.frame_color && (
              <div className="spec-item">
                <span className="spec-item__label">Color</span>
                <span className="spec-item__value">{product.frame_color}</span>
              </div>
            )}
          </div>

          {product.description && product.short_description && (
             <div className="product-info__description mt-2">
               <h3>Details</h3>
               <p className="whitespace-pre-line">{product.description}</p>
             </div>
          )}

          <div className="product-actions mt-2">
            <PurchaseButton product={product} variant="full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
