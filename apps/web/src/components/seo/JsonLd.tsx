/**
 * Inline JSON-LD `<script>` helper. Usage:
 *
 *   <JsonLd data={organizationSchema()} />
 *
 * Centralizes the dangerouslySetInnerHTML so per-schema components stay
 * declarative. Stringifies through JSON.stringify so we don't ship a third
 * party JSON-LD library.
 */
interface JsonLdProps {
  /** Pre-built schema object. The component does not validate it; tests do. */
  data: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>;
}

export function JsonLd({ data }: JsonLdProps): JSX.Element {
  // JSON.stringify with the default encoder is safe inside a `<script>` tag
  // for these payloads because we never inject untrusted user input here.
  // The only risk vector would be `</script>` substrings in user data; we
  // guard against that by escaping forward slashes before the tag close.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
