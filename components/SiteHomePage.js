import Head from "next/head";
import Featured from "@/components/Featured";
import CampaignBannerStrip from "@/components/CampaignBannerStrip";
import NewProducts from "@/components/NewProducts";
import Header from "@/components/Header";

export default function SiteHomePage({ site, featuredProduct, newProducts, catalogInsights, heroContent }) {
  return (
    <div>
      <Head>
        <title>{`${site.displayName} | St Michael's`}</title>
        <meta name="description" content={site.heroDescription} />
      </Head>
      <Header siteKey={site.key} />
      <Featured product={featuredProduct} catalogInsights={catalogInsights} site={site} heroContent={heroContent} />
      <CampaignBannerStrip heroes={heroContent?.secondaryHeroes || []} site={site} />
      <NewProducts newProducts={newProducts} catalogInsights={catalogInsights} site={site} />
    </div>
  );
}