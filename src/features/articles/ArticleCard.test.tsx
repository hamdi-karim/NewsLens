import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Article } from "@/domain/types";
import { ArticleCard } from "./ArticleCard";

const ARTICLE: Article = {
  id: "newsapi:https://bbc.co.uk/a",
  source: "newsapi",
  title: "Rates hold steady",
  description: "Central banks wait.",
  url: "https://bbc.co.uk/a",
  imageUrl: "https://bbc.co.uk/a.jpg",
  author: "Jane Doe",
  publisher: "BBC News",
  category: "business",
  publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

describe("ArticleCard", () => {
  it("links to the article in a new tab, safely, with an accessible hint", () => {
    render(<ArticleCard article={ARTICLE} />);

    const link = screen.getByRole("link", {
      name: "Rates hold steady (opens in a new tab)",
    });
    expect(link).toHaveAttribute("href", ARTICLE.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows the aggregator with its publisher, category, author, and relative date", () => {
    render(<ArticleCard article={ARTICLE} />);

    expect(screen.getByText("NewsAPI · BBC News")).toBeInTheDocument();
    expect(screen.getByText("business")).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText("about 2 hours ago")).toHaveAttribute(
      "datetime",
      ARTICLE.publishedAt,
    );
  });

  it("falls back to a placeholder when the image is missing or fails to load", () => {
    const { rerender } = render(<ArticleCard article={ARTICLE} />);
    const image = screen.getByRole("img", { name: ARTICLE.title });

    fireEvent.error(image);
    expect(screen.queryByRole("img", { name: ARTICLE.title })).toBeNull();

    rerender(
      <ArticleCard article={{ ...ARTICLE, id: "x", imageUrl: undefined }} />,
    );
    expect(screen.queryByRole("img", { name: ARTICLE.title })).toBeNull();
  });

  it("labels only the featured card as the top story", () => {
    const { rerender } = render(<ArticleCard article={ARTICLE} />);
    expect(screen.queryByText("Top story")).toBeNull();

    rerender(<ArticleCard article={ARTICLE} isFeatured />);
    expect(screen.getByText("Top story")).toBeInTheDocument();
  });
});
