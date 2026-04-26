/**
 * JSON-LD Schema Markup Helpers
 */

export interface LocalBusinessSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    '@type': string;
    price?: string;
    priceCurrency?: string;
    availability?: string;
  };
}

export interface ArticleSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image?: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: {
    '@type': string;
    name: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
}

export interface FAQSchema {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

export function renderSchema(schema: object): string {
  return JSON.stringify(schema);
}

export function generateLocalBusinessSchema(baseUrl: string): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Lunch Hub',
    description:
      'Lunch Hub is a restaurant discovery web app with map search, random picker, and spin wheel tools for finding places to eat.',
    url: baseUrl,
    logo: `${baseUrl}/icon/manifest-icon-512.png`,
    sameAs: [baseUrl],
    applicationCategory: 'FoodService',
    operatingSystem: 'Web',
  };
}

export function generateArticleSchema(
  title: string,
  description: string,
  url: string,
  datePublished: string,
  imageUrl: string,
  authorName: string
): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: imageUrl,
    url,
    datePublished,
    dateModified: datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lunch Hub',
      logo: {
        '@type': 'ImageObject',
        url: `${url.split('/').slice(0, 3).join('/')}/icon/manifest-icon-512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
