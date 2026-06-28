import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram } from "@fortawesome/free-brands-svg-icons";
import {
  faEnvelope,
  faGlobe,
  faHashtag,
  faLink,
  faPhone,
  faPlay,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";

const PLATFORM_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  website: "Website",
};

const PLATFORM_ICONS = {
  instagram: faInstagram,
  facebook: faFacebookF,
  fb: faFacebookF,
  tiktok: faPlay,
  x: faHashtag,
  youtube: faPlay,
  whatsapp: faPhone,
  linkedin: faShareNodes,
  website: faGlobe,
  email: faEnvelope,
};

function getPlatformKey(platform) {
  return String(platform || "").trim().toLowerCase();
}

function getPlatformLabel(platform) {
  const key = getPlatformKey(platform);
  return PLATFORM_LABELS[key] || platform || "Social";
}

function getDisplayText(link) {
  return link.label || link.handle || getPlatformLabel(link.platform);
}

function getPlatformIcon(platform) {
  return PLATFORM_ICONS[getPlatformKey(platform)] || faLink;
}

export default function SocialLinks({ links = [], variant = "store" }) {
  const visibleLinks = (Array.isArray(links) ? links : []).filter((link) => link?.active !== false && (link?.url || link?.handle));

  if (!visibleLinks.length) {
    return null;
  }

  const isHotel = variant === "hotel";
  const titleClass = isHotel
    ? "text-[rgba(245,238,226,0.64)]"
    : "text-[rgba(18,52,60,0.52)]";
  const iconClass = isHotel
    ? "border-[rgba(216,172,79,0.18)] bg-[rgba(255,250,243,0.08)] text-[#f8d78f] hover:bg-[rgba(216,172,79,0.16)] hover:text-[#fff1dc]"
    : "border-[rgba(31,44,51,0.1)] bg-[rgba(255,255,255,0.82)] text-[#8d5a1f] hover:bg-[rgba(248,242,232,0.96)] hover:text-[var(--foreground-strong)]";

  return (
    <div className="mt-5">
      <p className={`${titleClass} text-sm font-semibold uppercase tracking-[0.24em]`}>
        Social media
      </p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {visibleLinks.map((link, index) => {
          const label = getDisplayText(link);
          const platformLabel = getPlatformLabel(link.platform);
          const ariaLabel = `${platformLabel}: ${label}`;
          const icon = (
            <span
              className={`${iconClass} inline-flex size-11 items-center justify-center rounded-full border text-base shadow-sm transition hover:-translate-y-0.5`}
              title={ariaLabel}
              aria-label={ariaLabel}
            >
              <FontAwesomeIcon icon={getPlatformIcon(link.platform)} />
            </span>
          );

          return link.url ? (
            <a
              key={`${link.platform}-${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              aria-label={ariaLabel}
              title={ariaLabel}
            >
              {icon}
            </a>
          ) : (
            <span key={`${link.platform}-${link.handle}-${index}`}>{icon}</span>
          );
        })}
      </div>
    </div>
  );
}
