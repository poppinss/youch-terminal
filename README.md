# Youch terminal

![](http://res.cloudinary.com/adonisjs/image/upload/q_100/v1516380527/youch-terminal_n4lkcc.png)

This package converts the [youch](https://npmjs.com/package/youch) error message to a string to be displayed on terminal. The output of the function is colorized using [chalk](https://npmjs.com/package/chalk).

## Install
```
npm i youch-terminal
```

## Usage
Make sure you pass the output `toJSON` to the youch terminal function.

```js
const Youch = require('youch')
const forTerminal = require('youch-terminal')

const error = new Error('Some weird error')

new Youch(error, {})
.toJSON()
.then((output) => {
  console.log(forTerminal(output))
})
```
