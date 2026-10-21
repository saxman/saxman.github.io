#!/usr/bin/env python3
"""Convert HTML documents to Markdown, writing each .md file next to its source.

Usage: scripts/build-markdown.py [file.html ...]
  With no arguments, converts resume.html and cv.html.

The converter understands the class names used by resume.html and cv.html
(name, tagline, contact, entry, kind, label, note, ...). It is not a general
HTML-to-Markdown converter: unrecognized markup is flattened to plain text.
"""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import List, Optional, Union

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCES = [REPO_ROOT / "resume.html", REPO_ROOT / "cv.html"]

VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SKIPPED_TAGS = {"head", "script", "style", "template"}
HEADING_LEVELS = {"h1": 1, "h2": 2, "h3": 3, "h4": 4, "h5": 5, "h6": 6}


class Element:
    def __init__(self, tag: str, attrs: dict):
        self.tag = tag
        self.classes = set((attrs.get("class") or "").split())
        self.href = attrs.get("href")
        self.children: List[Union[Element, str]] = []

    def find(self, css_class: str) -> Optional[Element]:
        for child in self.children:
            if isinstance(child, Element):
                if css_class in child.classes:
                    return child
                found = child.find(css_class)
                if found:
                    return found
        return None


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Element("document", {})
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        element = Element(tag, dict(attrs))
        self.stack[-1].children.append(element)
        if tag not in VOID_TAGS:
            self.stack.append(element)

    def handle_endtag(self, tag):
        # Pop to the matching open tag, tolerating unclosed children.
        for depth in range(len(self.stack) - 1, 0, -1):
            if self.stack[depth].tag == tag:
                del self.stack[depth:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def escape_text(text: str) -> str:
    return re.sub(r"([\\`*_\[\]])", r"\\\1", text)


def escape_url(url: str) -> str:
    return url.replace(" ", "%20").replace("(", "%28").replace(")", "%29")


def wrap(text: str, delimiter: str) -> str:
    """Wrap text in emphasis delimiters, keeping surrounding spaces outside them."""
    stripped = text.strip()
    if not stripped:
        return text
    leading = " " if text[0].isspace() else ""
    trailing = " " if text[-1].isspace() else ""
    return f"{leading}{delimiter}{stripped}{delimiter}{trailing}"


def render_inline(nodes: List[Union[Element, str]]) -> str:
    parts = []
    for node in nodes:
        if isinstance(node, str):
            parts.append(escape_text(re.sub(r"\s+", " ", node)))
        elif node.tag in SKIPPED_TAGS:
            continue
        elif node.tag in ("strong", "b") or "label" in node.classes:
            parts.append(wrap(render_inline(node.children), "**"))
        elif node.tag in ("em", "i"):
            parts.append(wrap(render_inline(node.children), "*"))
        elif "kind" in node.classes:
            parts.append(f"*{render_inline(node.children).strip()}:*")
        elif node.tag == "a" and node.href:
            parts.append(f"[{render_inline(node.children).strip()}]({escape_url(node.href)})")
        elif node.tag == "br":
            parts.append(" ")
        else:
            parts.append(render_inline(node.children))
    return re.sub(r" {2,}", " ", "".join(parts))


def render_contact(element: Element) -> str:
    """Render separator-delimited contact items one per line, each ending with the separator."""
    items: List[List[Union[Element, str]]] = [[]]
    for child in element.children:
        if isinstance(child, Element) and "sep" in child.classes:
            items.append([])
        else:
            items[-1].append(child)
    rendered = [render_inline(item).strip() for item in items]
    return " ·\n".join(item for item in rendered if item)


def render_note(element: Element) -> str:
    """Turn a heading note like "(full list at X)" into a standalone "*Full list at X.*" line."""
    text = render_inline(element.children).strip()
    if text.startswith("(") and text.endswith(")"):
        text = text[1:-1].strip()
    if text and not text[-1] in ".!?":
        text += "."
    return wrap(text[:1].upper() + text[1:], "*")


def render_heading(element: Element) -> List[str]:
    note = next((child for child in element.children if isinstance(child, Element) and "note" in child.classes), None)
    title_nodes = [child for child in element.children if child is not note]
    blocks = ["#" * HEADING_LEVELS[element.tag] + " " + render_inline(title_nodes).strip()]
    if note:
        blocks.append(render_note(note))
    return blocks


def render_entry(element: Element) -> List[str]:
    """Render a job entry as an organization heading, a role and dates line, then its bullets."""
    title = element.find("entry-title")
    organization = element.find("org")
    role = element.find("role")
    dates = element.find("entry-dates")
    blocks = []
    if organization and role:
        blocks.append("### " + render_inline(organization.children).strip())
        subtitle = wrap(render_inline(role.children), "*")
        if dates:
            subtitle += " · " + render_inline(dates.children).strip()
        blocks.append(subtitle)
    elif title:
        blocks.append("### " + render_inline(title.children).strip())
        if dates:
            blocks.append(wrap(render_inline(dates.children), "*"))
    remaining = Element("div", {})
    remaining.children = [child for child in element.children if child is not title and child is not dates]
    return blocks + render_blocks(remaining)


def render_list(element: Element) -> str:
    items = [child for child in element.children if isinstance(child, Element) and child.tag == "li"]
    lines = []
    for number, item in enumerate(items, start=1):
        marker = f"{number}." if element.tag == "ol" else "-"
        lines.append(f"{marker} {render_inline(item.children).strip()}")
    return "\n".join(lines)


def render_blocks(element: Element) -> List[str]:
    blocks: List[str] = []
    for child in element.children:
        if isinstance(child, str):
            if child.strip():
                blocks.append(render_inline([child]).strip())
        elif child.tag in SKIPPED_TAGS:
            continue
        elif child.tag in HEADING_LEVELS:
            blocks.extend(render_heading(child))
        elif "entry" in child.classes:
            blocks.extend(render_entry(child))
        elif child.tag in ("ul", "ol"):
            blocks.append(render_list(child))
        elif "tagline" in child.classes:
            blocks.append(wrap(render_inline(child.children), "*"))
        elif "contact" in child.classes:
            blocks.append(render_contact(child))
        elif child.tag == "p":
            blocks.append(render_inline(child.children).strip())
        else:
            blocks.extend(render_blocks(child))
    return [block for block in blocks if block]


def convert(html: str) -> str:
    builder = TreeBuilder()
    builder.feed(html)
    builder.close()
    return "\n\n".join(render_blocks(builder.root)) + "\n"


def main(arguments: List[str]) -> int:
    sources = [Path(argument) for argument in arguments] or DEFAULT_SOURCES
    for source in sources:
        if not source.is_file():
            print(f"Not found: {source}", file=sys.stderr)
            return 1
        output = source.resolve().with_suffix(".md")
        output.write_text(convert(source.read_text(encoding="utf-8")), encoding="utf-8")
        print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
