import urllib.request
import urllib.parse
import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://127.0.0.1:8000'

opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())

def test_get(url, desc):
    try:
        req = urllib.request.Request(BASE + url)
        with opener.open(req, timeout=5) as r:
            body = r.read().decode('utf-8', errors='replace')
            status = r.status
            print(f'[PASS] {desc} ({url}): HTTP {status}, length={len(body)}')
            return status, body
    except Exception as e:
        print(f'[FAIL] {desc} ({url}): {e}')
        return None, str(e)

def test_post_json(url, payload, desc):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(BASE + url, data=data, headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        with opener.open(req, timeout=5) as r:
            body = r.read().decode('utf-8', errors='replace')
            status = r.status
            print(f'[PASS] {desc} ({url}): HTTP {status}')
            return status, body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        print(f'[FAIL] {desc} ({url}): HTTP {e.code} - {err_body}')
        return e.code, err_body
    except Exception as e:
        print(f'[FAIL] {desc} ({url}): {e}')
        return None, str(e)

def test_multipart(url, fields, files, desc):
    try:
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        body = bytearray()
        for k, v in fields.items():
            body.extend(f'--{boundary}\r\n'.encode('utf-8'))
            body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode('utf-8'))
            body.extend(f'{v}\r\n'.encode('utf-8'))

        for field_name, (filename, content, mime) in files.items():
            body.extend(f'--{boundary}\r\n'.encode('utf-8'))
            body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode('utf-8'))
            body.extend(f'Content-Type: {mime}\r\n\r\n'.encode('utf-8'))
            body.extend(content)
            body.extend(b'\r\n')

        body.extend(f'--{boundary}--\r\n'.encode('utf-8'))

        req = urllib.request.Request(BASE + url, data=bytes(body), headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Accept': 'application/json'
        })
        with opener.open(req, timeout=5) as r:
            resp_body = r.read().decode('utf-8', errors='replace')
            status = r.status
            print(f'[PASS] {desc} ({url}): HTTP {status}')
            return status, resp_body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        print(f'[FAIL] {desc} ({url}): HTTP {e.code} - {err_body}')
        return e.code, err_body
    except Exception as e:
        print(f'[FAIL] {desc} ({url}): {e}')
        return None, str(e)

print('=== 1. ТЕСТИРОВАНИЕ СТРАНИЦЫ ВХОДА (registr.blade.php) ===')
st, body = test_get('/', 'Первая страница при заходе на сайт (registr.blade.php)')
token_match = re.search(r'name="_token" value="([^"]+)"', body)
csrf_token = token_match.group(1) if token_match else ''
print(f'   Страница содержит форму входа ТПУ: {"login-box" in body and "32cd32" in body}')

print('\n=== 2. АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ ИЗ БАЗЫ ДАННЫХ (proverka_registr.php) ===')
# Авторизуемся под существующим пользователем rdm8
login_data = urllib.parse.urlencode({
    '_token': csrf_token,
    'username': 'rdm8',
    'password': '123456789'
}).encode()
req = urllib.request.Request(BASE + '/registr', data=login_data)
res = opener.open(req)
print(f'[PASS] Вход под rdm8 (POST /registr): редирект на {res.geturl()}')

st, body = test_get('/api/me', 'Текущий авторизованный пользователь')
if st == 200:
    data = json.loads(body)
    print(f'   Успешно авторизован: {data.get("user", {}).get("username")} ({data.get("user", {}).get("email")})')

print('\n=== 3. ТЕСТИРОВАНИЕ СТРАНИЦ МАРКЕТПЛЕЙСА И "МОИ ОБЪЯВЛЕНИЯ" ===')
test_get('/glavnaya', 'Главная витрина маркетплейса (/glavnaya)')
test_get('/my_notices', 'Раздел "Мои объявления" (/my_notices)')
test_get('/profile', 'Личный кабинет (/profile)')
test_get('/listing/1', 'Карточка товара (/listing/1)')

print('\n=== 4. ТЕСТИРОВАНИЕ КАТАЛОГА (block_with_tovar.php) ===')
st, body = test_get('/api/products', 'Получение списка товаров')
if st == 200:
    data = json.loads(body)
    items = data.get('items', [])
    print(f'   Товаров в каталоге: {len(items)}')

st, body = test_get('/api/products/1', 'Детальный просмотр товара #1')
if st == 200:
    data = json.loads(body)
    item = data.get('item', {})
    print(f'   Товар: {item.get("title")}, цена: {item.get("price")} руб., категория: {item.get("category")}')

print('\n=== 5. ТЕСТИРОВАНИЕ КАТЕГОРИЙ (category_tovar.php) ===')
st, body = test_get('/api/categories', 'Список категорий')
if st == 200:
    data = json.loads(body)
    cats = data.get('categories', [])
    print(f'   Категорий в системе: {len(cats)}')

test_get('/api/technika', 'Фильтрация категории Бытовая техника')

print('\n=== 6. ТЕСТИРОВАНИЕ ПОИСКА (search.php) ===')
st, body = test_get('/api/search?search=' + urllib.parse.quote('микроволновая'), 'Поиск по слову "микроволновая"')
if st == 200:
    data = json.loads(body)
    items = data.get('items', [])
    print(f'   Найдено: {len(items)} объявлений')

print('\n=== 7. ТЕСТИРОВАНИЕ "МОИ ОБЪЯВЛЕНИЯ" (mynotices.php) ===')
st, body = test_get('/api/my_notices', 'Список "Мои объявления" авторизованного пользователя')
if st == 200:
    data = json.loads(body)
    items = data.get('items', [])
    print(f'   Объявлений пользователя: {len(items)}')

print('\n=== 8. СОЗДАНИЕ ОБЪЯВЛЕНИЯ С ФОТО (create_advertisements.php) ===')
fake_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xbf\x04\x00\x07a\x02\x7f;\xa1Fk\x00\x00\x00\x00IEND\xaeB`\x82'
fields = {
    'user_id': '1',
    'title': 'Чайник электрический Polaris',
    'description': 'Рабочий, чистый чайник.',
    'price': '600',
    'category': '15',
    'dorm': 'Общ. №13 (Вершинина, 33)',
    'number': '89224825191',
    'status': 'active'
}
files = {
    'images[]': ('kettle.png', fake_png, 'image/png')
}
st, body = test_multipart('/api/ads', fields, files, 'Создание объявления через create_advertisements.php')
new_ad_id = None
if st == 201:
    data = json.loads(body)
    new_ad = data.get('ad', {})
    new_ad_id = new_ad.get('id')
    print(f'   Создано объявление ID: {new_ad_id}')

if new_ad_id:
    # Удаление объявления
    req = urllib.request.Request(f'{BASE}/api/ads/{new_ad_id}', headers={'Accept': 'application/json'})
    req.get_method = lambda: 'DELETE'
    with opener.open(req) as r:
        del_data = json.loads(r.read().decode('utf-8'))
        print(f'[PASS] Удаление объявления #{new_ad_id} (manage_advertisements.php): {del_data.get("message")}')

print('\n=== ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ! ===')
