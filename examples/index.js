'use strict'

/**
 * youch-terminal
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Youch = require('youch')
const { dim } = require('kleur')
const youchTerm = require('..')

function getUser () {
  throw new Error('Unable to find user')
}

async function run () {
  let youch

  try {
    getUser ()
  } catch (error) {
    youch = new Youch(error, {})
  }

  const output = await youch.toJSON()
  console.log(youchTerm(output, { displayShortPath: true, prefix: dim(' │ '), hideErrorTitle: false }))
}

run()
