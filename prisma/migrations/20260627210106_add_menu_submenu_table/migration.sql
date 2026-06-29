-- CreateTable
CREATE TABLE "menu_submenu" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_submenu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "menu_submenu_slug_key" ON "menu_submenu"("slug");

-- CreateIndex
CREATE INDEX "menu_submenu_parent_id_idx" ON "menu_submenu"("parent_id");

-- AddForeignKey
ALTER TABLE "menu_submenu" ADD CONSTRAINT "menu_submenu_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_submenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
