<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Categories
        $categories = [
            1  => 'Посуда',
            2  => 'Канцелярия',
            3  => 'Текстиль',
            4  => 'Периферия',
            5  => 'Гаджеты',
            6  => 'Мерч',
            7  => 'Спорт',
            8  => 'Настолки',
            9  => 'Гейминг',
            10 => 'Творчество',
            11 => 'Верхняя одежда',
            12 => 'Учебники и пособия',
            13 => 'Комплектующие',
            14 => 'Курсовые и конспекты',
            15 => 'Бытовая техника',
        ];

        foreach ($categories as $id => $name) {
            DB::table('categories')->updateOrInsert(
                ['category_id' => $id],
                ['name' => $name]
            );
        }

        // 2. Users
        $defaultPassword = Hash::make('123456789');

        $users = [
            [
                'user_id'       => 1,
                'username'      => 'rdm8',
                'email'         => 'rdm8@tpu.ru',
                'password_hash' => $defaultPassword,
                'phone'         => '89224825191',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'user_id'       => 2,
                'username'      => 'Алексей Соколов',
                'email'         => 'sokolov@tpu.ru',
                'password_hash' => $defaultPassword,
                'phone'         => '+7 999 123-45-67',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'user_id'       => 3,
                'username'      => 'Даниил К.',
                'email'         => 'daniil@tpu.ru',
                'password_hash' => $defaultPassword,
                'phone'         => '+7 913 222-33-44',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'user_id'       => 4,
                'username'      => 'Екатерина В.',
                'email'         => 'ekaterina@tpu.ru',
                'password_hash' => $defaultPassword,
                'phone'         => '+7 923 555-66-77',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['user_id' => $user['user_id']],
                $user
            );
        }

        // 3. Initial Advertisements
        $ads = [
            [
                'advertisements_id' => 1,
                'user_id'           => 3,
                'category_id'       => 15, // Бытовая техника
                'title'             => 'Микроволновая печь LG Grill',
                'description'       => 'Чистая, без запахов, тарелка целая, греет отлично. Мощность 800W, соответствие регламенту общежития.',
                'price'             => 2200.00,
                'status'            => 'active',
                'address'           => 'Общ. №13 (Вершинина, 33)',
                'number'            => '89224825191',
                'offer_type'        => 'sale',
                'condition'         => 'excellent',
                'created_at'        => now()->subMinutes(10),
            ],
            [
                'advertisements_id' => 2,
                'user_id'           => 4,
                'category_id'       => 12, // Учебники и пособия
                'title'             => 'Задачник по ТОЭ (Демирчян)',
                'description'       => 'Полный комплект для сдачи экзамена в ЭНИН. Чистый экземпляр без пометок ручкой.',
                'price'             => 350.00,
                'status'            => 'active',
                'address'           => 'Общ. №19 (Кирова)',
                'number'            => '89234523417',
                'offer_type'        => 'sale',
                'condition'         => 'good',
                'created_at'        => now()->subMinutes(25),
            ],
            [
                'advertisements_id' => 3,
                'user_id'           => 1,
                'category_id'       => 15, // Бытовая техника
                'title'             => 'Настольная лампа LED с USB',
                'description'       => 'Светит в 3 режимах яркости. Отдам первокурснику за шоколадку или бесплатно.',
                'price'             => 0.00,
                'status'            => 'active',
                'address'           => 'Общ. №16',
                'number'            => '89221112233',
                'offer_type'        => 'free',
                'condition'         => 'good',
                'created_at'        => now()->subMinutes(40),
            ],
            [
                'advertisements_id' => 4,
                'user_id'           => 2,
                'category_id'       => 14, // Курсовые и конспекты
                'title'             => 'Конспекты по физике (Иродов)',
                'description'       => 'Подробные рукописные конспекты и типовые расчеты за 1-2 семестры.',
                'price'             => 150.00,
                'status'            => 'active',
                'address'           => 'Общ. №13 (Вершинина, 33)',
                'number'            => '+7 999 123-45-67',
                'offer_type'        => 'sale',
                'condition'         => 'good',
                'created_at'        => now()->subHours(2),
            ],
            [
                'advertisements_id' => 5,
                'user_id'           => 3,
                'category_id'       => 4, // Периферия
                'title'             => 'Клавиатура механическая USB',
                'description'       => 'Механические синие переключатели, RGB подсветка, кабель в оплётке. Всё работает идеально.',
                'price'             => 1200.00,
                'status'            => 'active',
                'address'           => 'Общ. №12',
                'number'            => '89224825191',
                'offer_type'        => 'sale',
                'condition'         => 'excellent',
                'created_at'        => now()->subHours(5),
            ],
        ];

        foreach ($ads as $ad) {
            DB::table('advertisements')->updateOrInsert(
                ['advertisements_id' => $ad['advertisements_id']],
                $ad
            );
        }
    }
}
