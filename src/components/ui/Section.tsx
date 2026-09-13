import type { ReactNode } from "react";

import Container from "./Container";

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export default function Section({
  children,
  className = "",
  containerClassName = "",
}: SectionProps) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${className}`}>
      <Container className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}