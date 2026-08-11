import type { Metadata } from "next";
import {
  HomeHero,
  StatsStrip,
  FeaturedDocs,
  MemberNews,
  Testimonials,
  Resources,
  ReadyToJoin,
} from "@/components/sections";
import { loadSiteContent } from "@/lib/siteApi";

export const metadata: Metadata = {
  title: { default: "SACC — 南邮计软院科协", template: "%s | SACC" },
  description: "南京邮电大学计算机学院、软件学院、网络空间安全学院科学技术协会官方网站",
};

export const revalidate = 300;

export default async function HomePage() {
  const { data } = await loadSiteContent();

  return (
    <div className="flex flex-col">
      <HomeHero
        fullName={data.site.fullName}
        tagline={data.site.tagline}
        logoUrl={data.site.logoUrl}
        actions={data.home.heroActions}
      />
      <StatsStrip stats={data.home.stats} />
      <FeaturedDocs docs={data.docs} />
      <MemberNews news={data.news} />
      <Testimonials testimonials={data.home.testimonials} />
      <Resources resources={data.home.resources} />
      <ReadyToJoin cta={data.site.cta} />
    </div>
  );
}