<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Une categorías del sistema en `expense_categories` (`user_id` null, `names` JSON).
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $this->upSqlite();
        } else {
            $this->upMysqlOrPostgres($driver);
        }
    }

    private function upSqlite(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('expense_categories_new', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->json('names');
            $table->string('icon', 64);
            $table->string('slug', 64)->nullable()->unique();
            $table->unsignedSmallInteger('sort_order')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'name']);
        });

        foreach (DB::table('expense_categories')->orderBy('id')->get() as $row) {
            DB::table('expense_categories_new')->insert([
                'id' => $row->id,
                'user_id' => $row->user_id,
                'name' => $row->name,
                'names' => json_encode(['es' => $row->name, 'en' => $row->name]),
                'icon' => $row->icon,
                'slug' => null,
                'sort_order' => null,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        $nextId = (int) DB::table('expense_categories_new')->max('id') + 1;

        if (Schema::hasTable('default_expense_categories')) {
            foreach (DB::table('default_expense_categories')->orderBy('sort_order')->orderBy('id')->get() as $d) {
                DB::table('expense_categories_new')->insert([
                    'id' => $nextId++,
                    'user_id' => null,
                    'name' => null,
                    'names' => $d->names,
                    'icon' => $d->icon,
                    'slug' => $d->slug,
                    'sort_order' => $d->sort_order,
                    'created_at' => $d->created_at ?? now(),
                    'updated_at' => $d->updated_at ?? now(),
                ]);
            }
            Schema::drop('default_expense_categories');
        }

        Schema::drop('expense_categories');
        Schema::rename('expense_categories_new', 'expense_categories');

        $maxId = (int) DB::table('expense_categories')->max('id');
        DB::table('sqlite_sequence')->where('name', 'expense_categories')->delete();
        DB::table('sqlite_sequence')->insert(['name' => 'expense_categories', 'seq' => $maxId]);

        Schema::enableForeignKeyConstraints();
    }

    private function upMysqlOrPostgres(string $driver): void
    {
        Schema::table('expense_categories', function (Blueprint $table) {
            $table->json('names')->nullable();
            $table->string('slug', 64)->nullable()->unique();
            $table->unsignedSmallInteger('sort_order')->nullable();
        });

        foreach (DB::table('expense_categories')->orderBy('id')->cursor() as $row) {
            DB::table('expense_categories')->where('id', $row->id)->update([
                'names' => json_encode(['es' => $row->name, 'en' => $row->name]),
            ]);
        }

        if (Schema::hasTable('default_expense_categories')) {
            foreach (DB::table('default_expense_categories')->orderBy('sort_order')->cursor() as $d) {
                DB::table('expense_categories')->insert([
                    'user_id' => null,
                    'name' => null,
                    'names' => $d->names,
                    'icon' => $d->icon,
                    'slug' => $d->slug,
                    'sort_order' => $d->sort_order,
                    'created_at' => $d->created_at ?? now(),
                    'updated_at' => $d->updated_at ?? now(),
                ]);
            }
            Schema::drop('default_expense_categories');
        }

        Schema::table('expense_categories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE expense_categories MODIFY user_id BIGINT UNSIGNED NULL');
            DB::statement('ALTER TABLE expense_categories MODIFY name VARCHAR(255) NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE expense_categories ALTER COLUMN user_id DROP NOT NULL');
            DB::statement('ALTER TABLE expense_categories ALTER COLUMN name DROP NOT NULL');
        }

        Schema::table('expense_categories', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        //
    }
};
