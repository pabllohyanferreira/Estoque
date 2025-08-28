import React, { useState } from 'react';
import { Package } from 'lucide-react';

const ProductImage = ({ imageData, alt, className = "h-12 w-12 object-cover rounded-lg mr-3 border border-gray-200 dark:border-gray-600", fallbackClassName = "h-8 w-8 text-gray-400 dark:text-gray-500 mr-3" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageData || imageError) {
    return <Package className={fallbackClassName} />;
  }

  return (
    <>
      <img
        src={imageData}
        alt={alt}
        className={className}
        onError={(e) => {
          console.error('Erro ao carregar imagem:', e.target.src);
          setImageError(true);
        }}
        onLoad={() => {
          setImageLoaded(true);
        }}
        style={{ display: imageError ? 'none' : 'block' }}
      />
      {imageError && <Package className={fallbackClassName} />}
    </>
  );
};

export default ProductImage; 