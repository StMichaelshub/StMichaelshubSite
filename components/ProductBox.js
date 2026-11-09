import Link from "next/link";
import Image from "next/image";
import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus, faStar } from "@fortawesome/free-solid-svg-icons";
import { CartContext } from "./CartContext";
import { getPrimaryProductImage } from "@/lib/productImages";
import { getReviewSummary } from "@/lib/reviews";
import { getAvailableInventoryQuantity } from "@/lib/stockMath";
import { getPublicProductPath, normalizePublicSite } from "@/lib/publicSite";

const LOW_STOCK_THRESHOLD = 5;

function getStockLabel(availableQuantity) {
  if (availableQuantity <= 0) return { text: "Sold out", className: "bg-rose-50 text-rose-700" };
  if (availableQuantity <= LOW_STOCK_THRESHOLD) {
    return { text: `Only ${availableQuantity} left`, className: "bg-amber-50 text-amber-800" };
  }
  return { text: "In stock", className: "bg-emerald-50 text-emerald-700" };
}

function flyImageToCart(sourceImage) {
  const cartIcon = Array.from(document.querySelectorAll("[data-cart-icon]")).find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  if (!sourceImage || !cartIcon) return;

  const imgClone = sourceImage.cloneNode(true);
  const imgRect = sourceImage.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();

  Object.assign(imgClone.style, {
    position: "fixed",
    left: `${imgRect.left}px`,
    top: `${imgRect.top}px`,
    width: `${imgRect.width}px`,
    height: `${imgRect.height}px`,
    zIndex: 1000,
    transition: "all 0.7s ease-in-out",
    opacity: 0.8,
    pointerEvents: "none",
  });
  document.body.appendChild(imgClone);

  requestAnimationFrame(() => {
    Object.assign(imgClone.style, {
      left: `${cartRect.left + cartRect.width / 2}px`,
      top: `${cartRect.top + cartRect.height / 2}px`,
      width: "20px",
      height: "20px",
      opacity: 0,
    });
  });
  imgClone.addEventListener("transitionend", () => imgClone.remove());
}

/** Product card: tap anywhere to open it, one button to add it to the cart. */
export default function ProductBox({
  _id,
  name,
  images,
  salePriceIncTax,
  quantity,
  reservedQuantity,
  categoryName,
  category,
  reviews,
  siteKey,
}) {
  const { addProductToCart, cartProducts } = useContext(CartContext);
  const url = getPublicProductPath(normalizePublicSite(siteKey), _id);
  const productImage = getPrimaryProductImage(images);
  const reviewSummary = getReviewSummary(reviews);
  const availableQuantity = getAvailableInventoryQuantity({ quantity, reservedQuantity });
  const isInStock = availableQuantity > 0;
  const cartQuantity = cartProducts.find((item) => item.id === _id)?.qty || 0;
  const hasReachedCartLimit = isInStock && cartQuantity >= availableQuantity;
  const stock = getStockLabel(availableQuantity);

  const handleAddToCart = (event) => {
    if (!isInStock || hasReachedCartLimit) return;
    flyImageToCart(event.currentTarget.closest(".product-box")?.querySelector("img"));
    addProductToCart(_id, { maxQuantity: availableQuantity });
  };

  return (
    <article className="product-box store-shell-card flex h-full flex-col overflow-hidden rounded-[1.25rem] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(18,29,35,0.1)]">
      <Link href={url} className="relative block aspect-square bg-[linear-gradient(180deg,_rgba(248,243,236,0.96),_rgba(255,255,255,0.98))]">
        <Image
          src={productImage}
          alt={name}
          fill
          sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 22vw"
          className="object-contain p-4"
        />
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${stock.className}`}>
          {stock.text}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(18,52,60,0.5)]">
          {categoryName || category || "Product"}
        </p>
        <Link href={url} className="mt-1">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-[var(--foreground-strong)] hover:text-[#8d5a1f] sm:text-base sm:leading-6 sm:min-h-[3rem]">
            {name}
          </h3>
        </Link>

        {reviewSummary.count > 0 && (
          <p className="mt-1 text-xs text-[rgba(18,52,60,0.62)]">
            <FontAwesomeIcon icon={faStar} className="text-[#d59a4f]" /> {reviewSummary.averageLabel}
            <span className="ml-1">({reviewSummary.count})</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="text-base font-bold text-[#8d5a1f] sm:text-lg">₦{Number(salePriceIncTax || 0).toLocaleString()}</p>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isInStock || hasReachedCartLimit}
            aria-label={`Add ${name} to cart`}
            title={!isInStock ? "Sold out" : hasReachedCartLimit ? "All available stock is in your cart" : "Add to cart"}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ${
              isInStock && !hasReachedCartLimit
                ? "store-button-accent"
                : "cursor-not-allowed bg-[rgba(18,52,60,0.08)] text-[rgba(18,52,60,0.4)]"
            }`}
          >
            <FontAwesomeIcon icon={faCartPlus} />
            <span className="hidden sm:inline">{hasReachedCartLimit ? "In cart" : "Add"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
