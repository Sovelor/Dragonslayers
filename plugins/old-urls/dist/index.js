// Pages that moved list their old paths in frontmatter, e.g.
//   movedFrom:
//     - "Characters/Badinga Alpenrok"
// The alias-redirects emitter then writes a redirect page at each old URL.
// We don't use `aliases` for this: those are also added to the link index,
// so a moved page would clash with itself and break [[shortest]] links.

const toSlug = (p) =>
  String(p)
    .replace(/\\/g, "/")
    .replace(/\.md$/, "")
    .split("/")
    .map((seg) => seg.trim().replace(/\s/g, "-"))
    .join("/")

export default function OldUrls() {
  return {
    name: "OldUrls",
    htmlPlugins() {
      return [
        () => (_tree, file) => {
          const moved = file.data.frontmatter?.movedFrom
          if (!moved) return
          const list = Array.isArray(moved) ? moved : [moved]
          const slugs = new Set(file.data.aliases ?? [])
          for (const old of list) {
            const slug = toSlug(old)
            // Quartz serves lowercase URLs and redirects the original casing.
            slugs.add(slug.toLowerCase())
            slugs.add(slug)
          }
          file.data.aliases = [...slugs]
        },
      ]
    },
  }
}
