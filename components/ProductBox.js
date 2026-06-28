import Link from "next/link";
import Image from "next/image";
import { useContext } from "react";
import { CartContext } from "./CartContext";
import { getPrimaryProductImage } from "@/lib/productImages";
import { getReviewSummary } from "@/lib/reviews";
import { getAvailableInventoryQuantity } from "@/lib/inventory";
import { getPublicProductPath, normalizePublicSite } from "@/lib/publicSite";

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
    const resolvedSiteKey = normalizePublicSite(siteKey);
    const url = getPublicProductPath(resolvedSiteKey, _id);
    const productImage = getPrimaryProductImage(images);
    const reviewSummary = getReviewSummary(reviews);
    const availableQuantity = getAvailableInventoryQuantity({ quantity, reservedQuantity });
    const isInStock = availableQuantity > 0;
    const cartQuantity = cartProducts.find((item) => item.id === _id)?.qty || 0;
    const hasReachedCartLimit = isInStock && cartQuantity >= availableQuantity;

    const handleAddToCart = (e) => {
        if (!isInStock || hasReachedCartLimit) {
            return;
        }

        const productImage = e.currentTarget.closest(".product-box").querySelector("img");
        const cartIcon = Array.from(document.querySelectorAll("[data-cart-icon]"))
            .find((element) => {
                const rect = element.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });

        if (productImage && cartIcon) {
            const imgClone = productImage.cloneNode(true);
            const imgRect = productImage.getBoundingClientRect();
            const cartRect = cartIcon.getBoundingClientRect();

            imgClone.style.position = "fixed";
            imgClone.style.left = `${imgRect.left}px`;
            imgClone.style.top = `${imgRect.top}px`;
            imgClone.style.width = `${imgRect.width}px`;
            imgClone.style.height = `${imgRect.height}px`;
            imgClone.style.zIndex = 1000;
            imgClone.style.transition = "all 0.7s ease-in-out";
            imgClone.style.opacity = 0.8;

            document.body.appendChild(imgClone);

            requestAnimationFrame(() => {
                imgClone.style.left = `${cartRect.left + cartRect.width / 2}px`;
                imgClone.style.top = `${cartRect.top + cartRect.height / 2}px`;
                imgClone.style.width = "20px";
                imgClone.style.height = "20px";
                imgClone.style.opacity = 0;
            });

            imgClone.addEventListener("transitionend", () => {
                imgClone.remove();
            });
        }

        addProductToCart(_id, { maxQuantity: availableQuantity });
    };

    return (
        <div className="product-box store-shell-card flex h-full flex-col overflow-hidden rounded-[1.45rem] transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(18,29,35,0.1)] sm:rounded-[1.6rem]">
            <Link href={url} className="block p-3 pb-0 sm:p-4 sm:pb-0">
                <div className="rounded-[1.35rem] border border-[rgba(31,44,51,0.08)] bg-[linear-gradient(180deg,_rgba(248,243,236,0.96),_rgba(255,255,255,0.98))] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <span className="store-tag max-w-[60%] rounded-full px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.2em] sm:text-[0.68rem]">
                            {categoryName || category || "Featured"}
                        </span>
                        <span className={`inline-flex min-h-[2.25rem] items-center rounded-full px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] sm:text-[0.68rem] ${
                            isInStock
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                        }`}>
                            {isInStock ? `${availableQuantity.toLocaleString()} Ready` : "Sold out"}
                        </span>
                    </div>

                    <div className="relative mt-5 h-40 w-full sm:h-44">
                        <Image
                            src={productImage}
                            alt={name}
                            fill
                            sizes="(max-width: 640px) 74vw, (max-width: 1024px) 30vw, 16vw"
                            className="object-contain"
                        />
                    </div>
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
                <Link href={url}>
                    <h2 className="min-h-[2.9rem] line-clamp-2 text-base font-semibold leading-6 text-[var(--foreground-strong)] sm:min-h-[3.1rem] sm:text-[1.06rem] sm:leading-7">
                        {name}
                    </h2>
                </Link>

                <p className="mt-2 text-sm leading-6 store-shell-muted">
                    {reviewSummary.count > 0
                        ? `${reviewSummary.averageLabel} / 5 from ${reviewSummary.count} review${reviewSummary.count === 1 ? "" : "s"}`
                        : "No reviews yet."}
                </p>

                <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.46)]">Price</p>
                        <p className="mt-1 text-xl font-bold text-[#8d5a1f]">₦{salePriceIncTax?.toLocaleString()}</p>
                    </div>
                    <Link href={url} className="text-sm font-semibold text-[var(--foreground-strong)] transition hover:text-[#8d5a1f]">
                        View details
                    </Link>
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={!isInStock || hasReachedCartLimit}
                    className={`mt-4 w-full min-h-[3.1rem] rounded-[1.05rem] px-4 text-sm font-semibold transition cursor-pointer sm:mt-auto sm:min-h-[3.2rem] ${
                        isInStock && !hasReachedCartLimit
                            ? "store-button-accent"
                            : "bg-[rgba(18,52,60,0.08)] text-[rgba(18,52,60,0.4)] cursor-not-allowed"
                    }`}
                >
                    {!isInStock
                        ? "Sold out"
                        : hasReachedCartLimit
                            ? "Cart limit reached"
                            : "Add to cart"}
                </button>
            </div>
        </div>
    );
}
