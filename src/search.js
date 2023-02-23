'use strict'

require('dotenv').config()

const logger = require('log4js').getLogger()
logger.level = process.env.LOGGER_LEVEL ?? 'warn'

const fs = require('fs').promises

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: 'db',
    user: 'root',
    password: 'root',
    database: 'employee',
    stringifyObjects: true,
  }
})

const main = async () => {
  while (1) {
    const answer = await prompt('操作を選択して下さい: [N]名前検索 [Y]入社年数 [Q]システム終了')
    switch (answer) {
      case 'N': // 名前検索
        while (1) {
          const name = await prompt('検索したい名前を入力して下さい')
          if (!name.length) continue
          await searchEmployees('Name', {name})
          break
        }
        break
      case 'Y': // 勤続年数検索
        while (1) { 
          const year = await prompt('検索したい入社年数を入力して下さい')
          if (!year.match(/^[1-9][0-9]*$/)) continue
          await searchEmployees('Year', {year})
          break
        }
        break
      case 'Q': // 実行終了
        return
      case 'C': // キャッシュ削除(デバッグ用)
        await clearCache()
        break
    }
  }
}

// 標準入力からコマンドを受け付ける
const prompt = async (msg) => {
  return new Promise(resolve => {
    const reader = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    reader.question(`> ${msg}\n`, answer => {
      reader.close()
      resolve(answer.trim())
    })
  })
}

// 社員の検索
const searchEmployees = async (mode, conditions) => {

  const query = knex('employees')
    .join('posts', 'employees.id', 'posts.employee_id')
    .select(
      'employees.*', 
      knex.raw('TIMESTAMPDIFF(YEAR, employees.entried, NOW())+1 year'), 
      knex.raw('GROUP_CONCAT(posts.name separator \'/\') post_names')
    )
    .groupBy('employees.id')

  if (mode === 'Name') {
    // 名前検索
    conditions.name = conditions.name.replace(/%/, '\\%')
    query.where('employees.name', 'like', `%${conditions.name}%`)
  } else if (mode === 'Year') {
    // 勤続年数検索
    query.whereRaw('TIMESTAMPDIFF(YEAR, entried, NOW())+1 = ?', conditions.year)
  }

  // キャッシュのロード試行
  const rows = await cache(query)

  rows.map(row => console.log(`${row.id},${row.name},${row.year},${row.post_names}`))
}

// キャッシュを検索し、ヒットすれば結果をそのまま返す
// ヒットしなければ結果を新たに取得して返す
const cache = async (query) => {
  // クエリをhash化してキャッシュキー(=ファイル名)とする
  const serialized = JSON.stringify(query.toSQL().toNative())
  const hash = require('crypto').createHash('sha256').update(serialized).digest('hex')

  logger.debug('query', query.toSQL().toNative())
  logger.debug('hashedQuery', hash)

  const cache_path = `./cache/${hash}`
  return await fs.readFile(cache_path, 'utf-8')
    .then(res => {
      // キャッシュのロード成功
      logger.debug('Succeeded to load cache. retrieving data from the cache.')
      return JSON.parse(res)
    })
    .catch(async err => {
      // キャッシュのロード失敗
      logger.debug('Failed to load cache. retrieving data from the database.')
      const result = await query.select()

      logger.debug(`Save a cache "${hash}".`)
      await fs.writeFile(cache_path, JSON.stringify(result))

      return result
    })
}

// キャッシュの全削除（デバッグ用）
const clearCache = async () => {
  logger.debug('Clear all caches')
  await fs.readdir('./cache')
    .then(files => {
      files.forEach(file => {
        if (file.match(/^[0-9a-f]+$/)) {
          fs.unlink(`./cache/${file}`)
        }
      })
    })
}

(async () => {
  await main()
  console.log('bye')
  knex.destroy()
})()
