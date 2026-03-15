import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import SiteIcon from './SiteIcon';

interface RichTextEditorProps {
    value: string;
    onChange: (nextValue: string) => void;
    onUploadImage: (file: File) => Promise<string>;
}

interface ToolbarButtonProps {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    icon: Parameters<typeof SiteIcon>[0]['name'];
}

function ToolbarButton({ label, active = false, disabled = false, onClick, icon }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            className={`action-chip rich-editor-chip ${active ? 'is-active' : ''}`}
            onClick={onClick}
            disabled={disabled}
            title={label}
        >
            <SiteIcon name={icon} size={14} />
            <span>{label}</span>
        </button>
    );
}

export default function RichTextEditor({ value, onChange, onUploadImage }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3, 4],
                },
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
            Image,
        ],
        content: value || '<p></p>',
        editorProps: {
            attributes: {
                class: 'rich-editor-surface',
                'data-testid': 'rich-editor-content',
            },
        },
        onUpdate({ editor: currentEditor }) {
            onChange(currentEditor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        const currentHtml = editor.getHTML();
        const nextHtml = value || '<p></p>';

        if (currentHtml !== nextHtml) {
            editor.commands.setContent(nextHtml, false);
        }
    }, [editor, value]);

    const handleLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href as string | undefined;
        const nextUrl = window.prompt('输入链接地址', previousUrl || 'https://');

        if (nextUrl === null) {
            return;
        }

        if (!nextUrl.trim()) {
            editor.chain().focus().unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: nextUrl.trim() }).run();
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor || !event.target.files?.length) {
            return;
        }

        try {
            const url = await onUploadImage(event.target.files[0]);
            editor.chain().focus().setImage({ src: url, alt: 'article image' }).run();
        } finally {
            event.target.value = '';
        }
    };

    if (!editor) {
        return <div className="empty-state">正在加载富文本编辑器...</div>;
    }

    return (
        <div className="rich-editor-shell">
            <div className="rich-editor-toolbar">
                <ToolbarButton label="加粗" icon="spark" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
                <ToolbarButton label="斜体" icon="pen" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
                <ToolbarButton label="删除线" icon="close" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
                <ToolbarButton label="H2" icon="grid" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                <ToolbarButton label="H3" icon="grid" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
                <ToolbarButton label="列表" icon="chevron-right" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
                <ToolbarButton label="编号" icon="calendar" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
                <ToolbarButton label="引用" icon="copy" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
                <ToolbarButton label="代码块" icon="code" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
                <ToolbarButton label="链接" icon="external" active={editor.isActive('link')} onClick={handleLink} />
                <ToolbarButton label="图片" icon="folder" onClick={() => fileInputRef.current?.click()} />
                <ToolbarButton label="撤销" icon="arrow-right" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
                <ToolbarButton label="重做" icon="arrow-right" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
            </div>
            <EditorContent editor={editor} />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        </div>
    );
}
