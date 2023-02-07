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
  const error = new Error('Unable to find user')
  error.help = [
    'We tried looking for using inside the "users" table',
    'The search was performed using the where (email = user.email) and (is_active = true)'
  ]

  throw error
}

async function run () {
  let youch

  try {
    getUser ()
  } catch (error) {
    youch = new Youch(error, {})
  }

  const output = await youch.toJSON()
  console.log(youchTerm(output, {
    displayShortPath: true,
    hideErrorTitle: false,
    hideMessage: false,
    displayMainFrameOnly: false,
  }))
}

run()
