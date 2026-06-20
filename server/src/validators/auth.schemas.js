import Joi from 'joi'

import { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } from '../middleware/validators.js'



const email = Joi.string().email().trim().lowercase().required()

const password = Joi.string().pattern(PASSWORD_REGEX).required().messages({

  'string.pattern.base': PASSWORD_POLICY_MESSAGE,

})



/** POST /api/auth/signup | /register */

export const signupSchema = Joi.object({

  email,

  password,

  phone: Joi.string().trim().max(20).allow('').default(''),

  name: Joi.string().trim().min(2).max(120),

  firstName: Joi.string().trim().min(1).max(60),

  lastName: Joi.string().trim().min(1).max(60),

}).custom((value, helpers) => {

  if (value.name || value.firstName) return value

  return helpers.message('Provide name or firstName')

})



/** POST /api/auth/login */

export const loginSchema = Joi.object({

  email,

  password: Joi.string().min(8).max(128).required(),

})



/** PUT /api/auth/profile */

export const updateProfileSchema = Joi.object({

  name: Joi.string().trim().min(2).max(120),

  firstName: Joi.string().trim().min(1).max(60),

  lastName: Joi.string().trim().min(1).max(60),

  phone: Joi.string().trim().max(20).allow(''),

  address: Joi.string().trim().max(200).allow(''),

}).min(1)



/** DELETE /api/auth/account — optional password confirmation */

export const deleteAccountSchema = Joi.object({

  password: Joi.string().min(8).max(128),

})


