-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "categoryId" INTEGER,
    "seriesId" INTEGER,
    "seriesOrder" INTEGER,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "email" TEXT,
    "postId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMeta" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "readTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" TEXT NOT NULL DEFAULT '',
    "liveUrl" TEXT,
    "repoUrl" TEXT,
    "coverImage" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Renamed from _PostTags to PostTags to allow direct Supabase access)
CREATE TABLE "PostTags" (
    "postId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PostMeta_postId_key" ON "PostMeta"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PostTags_unique" ON "PostTags"("postId", "tagId");
CREATE INDEX "PostTags_tagId_index" ON "PostTags"("tagId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMeta" ADD CONSTRAINT "PostMeta_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTags" ADD CONSTRAINT "PostTags_post_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTags" ADD CONSTRAINT "PostTags_tag_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Function: Increment Page View
CREATE OR REPLACE FUNCTION increment_page_view(page_slug TEXT)
RETURNS VOID AS $$
DECLARE
  p_id INT;
BEGIN
  SELECT id INTO p_id FROM "Post" WHERE slug = page_slug;
  IF FOUND THEN
    INSERT INTO "PostMeta" ("postId", "views", "likes", "readTime")
    VALUES (p_id, 1, 0, 0)
    ON CONFLICT ("postId")
    DO UPDATE SET "views" = "PostMeta"."views" + 1;
  END IF;
END;
$$ LANGUAGE plpgsql;
