import type { Metadata } from "next";

import { OnboardingJourney } from "@/components/app/OnboardingJourney";

export const metadata: Metadata = { title: "Bienvenido a Eternime" };

type WelcomePageProps = {
  searchParams: Promise<{ step?: string }>;
};

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const query = await searchParams;
  const requestedStep = Number(query.step);
  const initialStep = requestedStep >= 1 && requestedStep <= 3 ? requestedStep : 1;
  return <OnboardingJourney initialStep={initialStep} />;
}
