import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import SiteIcon from './SiteIcon';

interface CommentEditorProps {
    value: string;
    onChange: (nextValue: string) => void;
    placeholder?: string;
    testId?: string;
}

interface ToolbarButtonProps {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    icon: Parameters<typeof SiteIcon>[0]['name'];
}

const EMOJIS = [
    '😀', '😄', '😁', '😂', '🥲', '🙂', '😉', '😍', '🤔', '😅', '😮', '😢',
    '👍', '👎', '👏', '🙏', '🔥', '✨', '💡', '🎯', '✅', '⚠️', '❌', '🔗',
];

function ToolbarButton({ label, active = false, disabled = false, onClick, icon }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            className={`action-chip comment-editor-chip ${active ? 'is-active' : ''}`}
            onClick={onClick}
            disabled={disabled}
            title={label}
            aria-label={label}
        >
            <SiteIcon name={icon} size={14} />
            <span>{label}</span>
        </button>
    );
}

export default function CommentEditor({ value, onChange, placeholder = '写下你的观点…', testId }: CommentEditorProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [emojiOpen, setEmojiOpen] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                // Keep comments short and predictable (no nested structures).
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
        ],
        content: value || '<p></p>',
        editorProps: {
            attributes: {
                class: 'comment-editor-surface',
                'data-testid': testId ? `${testId}-content` : 'comment-editor-content',
            },
        },
        onUpdate({ editor: currentEditor }) {
            onChange(currentEditor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) return;
        const currentHtml = editor.getHTML();
        const nextHtml = value || '<p></p>';
        if (currentHtml !== nextHtml) {
            editor.commands.setContent(nextHtml, false);
        }
    }, [editor, value]);

    useEffect(() => {
        function handleDocClick(event: MouseEvent) {
            if (!emojiOpen) return;
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (target.closest('.emoji-popover') || target.closest('[data-emoji-toggle=\"true\"]')) {
                return;
            }
            setEmojiOpen(false);
        }

        document.addEventListener('click', handleDocClick);
        return () => document.removeEventListener('click', handleDocClick);
    }, [emojiOpen]);

    const handleLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href as string | undefined;
        const nextUrl = window.prompt('输入链接地址', previousUrl || 'https://');

        if (nextUrl === null) return;

        if (!nextUrl.trim()) {
            editor.chain().focus().unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: nextUrl.trim() }).run();
    };

    const insertEmoji = (emoji: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(emoji).run();
        setEmojiOpen(false);
    };

    if (!editor) {
        return <div className="empty-state">正在加载评论编辑器...</div>;
    }

    return (
        <div className="comment-editor-shell" data-testid={testId || 'comment-editor'}>
            <div className="comment-editor-toolbar">
                <ToolbarButton label="加粗" icon="spark" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
                <ToolbarButton label="斜体" icon="pen" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
                <ToolbarButton label="删除线" icon="close" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
                <ToolbarButton label="行内代码" icon="code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
                <ToolbarButton label="引用" icon="copy" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
                <ToolbarButton label="列表" icon="chevron-right" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
                <ToolbarButton label="编号" icon="calendar" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
                <ToolbarButton label="代码块" icon="code" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
                <ToolbarButton label="链接" icon="external" active={editor.isActive('link')} onClick={handleLink} />

                <button
                    type="button"
                    className={`action-chip comment-editor-chip ${emojiOpen ? 'is-active' : ''}`}
                    onClick={() => setEmojiOpen((current) => !current)}
                    data-emoji-toggle="true"
                    aria-label="表情"
                    title="表情"
                >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>🙂</span>
                    <span>表情</span>
                </button>

                {/* Keep ref for future extension parity with RichTextEditor (no uploads allowed). */}
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} />
            </div>

            {emojiOpen ? (
                <div className="emoji-popover" role="dialog" aria-label="选择表情">
                    <div className="emoji-grid">
                        {EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                className="emoji-btn"
                                onClick={() => insertEmoji(emoji)}
                                aria-label={`表情 ${emoji}`}
                                title={emoji}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            <EditorContent editor={editor} />
            {/* Placeholder handled by CSS. */}
            <span className="sr-only">{placeholder}</span>
        </div>
    );
}
