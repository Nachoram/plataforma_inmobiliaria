import React, { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Importar módulos de Quill
const Font = Quill.import('formats/font');
const Size = Quill.import('formats/size');

// Configurar fuentes disponibles
Font.whitelist = ['arial', 'times-new-roman', 'courier-new', 'georgia'];
Size.whitelist = ['small', 'normal', 'large', 'huge'];

Quill.register(Font, true);
Quill.register(Size, true);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escribe el contenido del contrato...",
  readOnly = false,
  className = ""
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': Font.whitelist }],
      [{ 'size': Size.whitelist }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'align',
    'blockquote', 'code-block',
    'link'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          height: '400px',
          backgroundColor: 'white'
        }}
      />
      <style jsx>{`
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom: none;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }

        .rich-text-editor .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-top: none;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 14px;
          line-height: 1.6;
        }

        .rich-text-editor .ql-editor {
          padding: 1rem;
          min-height: 350px;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        /* Estilos específicos para contratos legales */
        .rich-text-editor .ql-editor h1,
        .rich-text-editor .ql-editor h2,
        .rich-text-editor .ql-editor h3 {
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }

        .rich-text-editor .ql-editor h1 {
          font-size: 2em;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.3em;
        }

        .rich-text-editor .ql-editor h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.2em;
        }

        .rich-text-editor .ql-editor h3 {
          font-size: 1.25em;
        }

        .rich-text-editor .ql-editor p {
          margin-bottom: 1em;
        }

        .rich-text-editor .ql-editor strong {
          font-weight: bold;
        }

        .rich-text-editor .ql-editor em {
          font-style: italic;
        }

        .rich-text-editor .ql-editor u {
          text-decoration: underline;
        }

        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          background-color: #f8fafc;
        }

        .rich-text-editor .ql-editor pre {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          padding: 0.75rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
          overflow-x: auto;
        }

        /* Estilos para listas */
        .rich-text-editor .ql-editor ol,
        .rich-text-editor .ql-editor ul {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }

        .rich-text-editor .ql-editor li {
          margin-bottom: 0.25rem;
        }

        /* Estilos para alineación */
        .rich-text-editor .ql-editor .ql-align-center {
          text-align: center;
        }

        .rich-text-editor .ql-editor .ql-align-right {
          text-align: right;
        }

        .rich-text-editor .ql-editor .ql-align-justify {
          text-align: justify;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
