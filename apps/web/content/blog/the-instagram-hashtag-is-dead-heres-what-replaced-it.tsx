import type { Post } from '../../src/lib/blog';

export const post: Post = {
  meta: {
    slug: 'the-instagram-hashtag-is-dead-heres-what-replaced-it',
    title: 'The Instagram hashtag is dead. Here is what replaced it.',
    description:
      'Wedding hashtags stopped working around 2020. WedPics shut down in 2019. The Knot retired Guest in 2022. Here is the QR-code wall pattern hosts actually use now.',
    date: '2026-04-22',
    keywords: [
      'wedding hashtag alternative',
      'wedding photo wall',
      'qr code wedding photos',
      'wedding photo sharing app',
    ],
    heroImageAlt: 'A printed QR code on a wedding table card next to a centerpiece.',
  },
  Body: (): JSX.Element => <p>Stub. Full body lands in the next commit.</p>,
};
