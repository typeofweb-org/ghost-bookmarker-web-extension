/**
 * Creates the Lexical root node needed for a post creation
 * @returns {object}
 */
export const getLexicalRoot = () => {
  return {
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
};

/**
 * Creates a Lexical node for a given link
 * @param {string} link
 * @returns {object}
 */
export const getLinkNode = (link) => {
  return {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: link,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "link",
        version: 1,
        rel: null,
        target: null,
        title: null,
        url: link,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  };
};

/**
 * Creates a Lexical bookmark card node when provided with oEmbed data
 * @param {object} data
 * @param {string} data.url
 * @param {string} data.title
 * @param {string} data.description
 * @param {string} data.author
 * @param {string} data.publisher
 * @param {string} data.thumbnail
 * @param {string} data.caption
 * @returns {object}
 */
export const getBookmarkNode = ({
  url = "",
  icon = "",
  title = "",
  description = "",
  author = "",
  publisher = "",
  thumbnail = "",
  caption = "",
}) => {
  return {
    type: "bookmark",
    version: 1,
    url,
    metadata: {
      icon,
      title,
      description,
      author,
      publisher,
      thumbnail,
    },
    caption,
  };
};

/**
 * Creates a Lexical text node for a given text (note)
 * @param {string} note
 * @returns {object}
 */
export const getNoteNode = (note) => {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: note,
        type: "text",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  };
};

/**
 * Creates an empty Lexical node
 * @returns {object}
 */
export const getEmptyNode = () => {
  return {
    children: [],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  };
};
