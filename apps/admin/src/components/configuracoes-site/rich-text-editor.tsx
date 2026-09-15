'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  type LucideIcon,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ icon: Icon, label, onClick, active, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-accent text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="mx-1 h-6 w-px bg-border" />;
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      paragraph: e.isActive('paragraph'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      link: e.isActive('link'),
      alignLeft: e.isActive({ textAlign: 'left' }),
      alignCenter: e.isActive({ textAlign: 'center' }),
      alignRight: e.isActive({ textAlign: 'right' }),
      alignJustify: e.isActive({ textAlign: 'justify' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  function handleLink() {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Endereço do link (https://..., mailto:... ou tel:...)', previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '' || url.trim() === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  const chain = () => editor.chain().focus();

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1">
      <ToolbarButton icon={Pilcrow} label="Parágrafo" active={state.paragraph} disabled={disabled} onClick={() => chain().setParagraph().run()} />
      <ToolbarButton icon={Heading2} label="Título" active={state.h2} disabled={disabled} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton icon={Heading3} label="Subtítulo" active={state.h3} disabled={disabled} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <ToolbarSeparator />
      <ToolbarButton icon={Bold} label="Negrito" active={state.bold} disabled={disabled} onClick={() => chain().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="Itálico" active={state.italic} disabled={disabled} onClick={() => chain().toggleItalic().run()} />
      <ToolbarButton icon={UnderlineIcon} label="Sublinhado" active={state.underline} disabled={disabled} onClick={() => chain().toggleUnderline().run()} />
      <ToolbarButton icon={Strikethrough} label="Tachado" active={state.strike} disabled={disabled} onClick={() => chain().toggleStrike().run()} />
      <ToolbarSeparator />
      <ToolbarButton icon={LinkIcon} label="Inserir/editar link" active={state.link} disabled={disabled} onClick={handleLink} />
      <ToolbarButton icon={Unlink} label="Remover link" disabled={disabled || !state.link} onClick={() => chain().extendMarkRange('link').unsetLink().run()} />
      <ToolbarSeparator />
      <ToolbarButton icon={List} label="Lista com marcadores" active={state.bulletList} disabled={disabled} onClick={() => chain().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} label="Lista numerada" active={state.orderedList} disabled={disabled} onClick={() => chain().toggleOrderedList().run()} />
      <ToolbarButton icon={Quote} label="Citação" active={state.blockquote} disabled={disabled} onClick={() => chain().toggleBlockquote().run()} />
      <ToolbarButton icon={Minus} label="Linha horizontal" disabled={disabled} onClick={() => chain().setHorizontalRule().run()} />
      <ToolbarSeparator />
      <ToolbarButton icon={AlignLeft} label="Alinhar à esquerda" active={state.alignLeft} disabled={disabled} onClick={() => chain().setTextAlign('left').run()} />
      <ToolbarButton icon={AlignCenter} label="Centralizar" active={state.alignCenter} disabled={disabled} onClick={() => chain().setTextAlign('center').run()} />
      <ToolbarButton icon={AlignRight} label="Alinhar à direita" active={state.alignRight} disabled={disabled} onClick={() => chain().setTextAlign('right').run()} />
      <ToolbarButton icon={AlignJustify} label="Justificar" active={state.alignJustify} disabled={disabled} onClick={() => chain().setTextAlign('justify').run()} />
      <ToolbarSeparator />
      <ToolbarButton icon={RemoveFormatting} label="Limpar formatação" disabled={disabled} onClick={() => chain().unsetAllMarks().clearNodes().run()} />
      <ToolbarButton icon={Undo2} label="Desfazer" disabled={disabled || !state.canUndo} onClick={() => chain().undo().run()} />
      <ToolbarButton icon={Redo2} label="Refazer" disabled={disabled || !state.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);

  const editor = useEditor({
    // Evita divergência de hidratação no Next.js.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          protocols: ['mailto', 'tel'],
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[320px] px-4 py-3 focus:outline-none dark:prose-invert',
        ...(placeholder ? { 'aria-placeholder': placeholder } : {}),
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.isEmpty ? '' : e.getHTML());
    },
  });

  // Sincroniza quando o valor muda de fora (carregamento inicial, descarte de alterações, modo HTML).
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1">
          {editor ? <Toolbar editor={editor} disabled={sourceMode} /> : <div className="h-[41px] border-b border-border" />}
        </div>
        <button
          type="button"
          onClick={() => setSourceMode((mode) => !mode)}
          aria-pressed={sourceMode}
          title={sourceMode ? 'Voltar ao editor visual' : 'Editar o código HTML'}
          className={cn(
            'flex shrink-0 items-center gap-1.5 border-b border-l border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            sourceMode && 'bg-accent text-foreground',
          )}
        >
          <Code2 className="h-4 w-4" />
          HTML
        </button>
      </div>

      {sourceMode ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          className="min-h-[320px] resize-y rounded-none border-0 font-mono text-xs shadow-none focus-visible:ring-0"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
