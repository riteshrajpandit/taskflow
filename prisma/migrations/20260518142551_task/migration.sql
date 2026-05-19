-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "estimated_time" INTEGER NOT NULL DEFAULT 25,
    "actual_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_infinite" BOOLEAN NOT NULL DEFAULT false,
    "extension_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemState" (
    "id" SERIAL NOT NULL,
    "current_active_task_id" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'parallel',
    "suppressed_notifications" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_created_at_idx" ON "Task"("created_at");

-- CreateIndex
CREATE INDEX "Session_task_id_idx" ON "Session"("task_id");

-- CreateIndex
CREATE INDEX "Session_start_time_idx" ON "Session"("start_time");

-- CreateIndex
CREATE INDEX "Session_end_time_idx" ON "Session"("end_time");

-- CreateIndex
CREATE UNIQUE INDEX "SystemState_id_key" ON "SystemState"("id");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
