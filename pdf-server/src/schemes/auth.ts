import Joi, { ObjectSchema } from 'joi';

export const signupSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be of type string',
    'string.email': 'Invalid email',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Password must be at least 6 characters',
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});

export const signinSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be of type string',
    'string.email': 'Invalid email',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.base': 'Password must be of type string',
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});

export const scoreSchema: ObjectSchema = Joi.object().keys({
  score: Joi.number().min(-1).max(1).required().messages({
    'number.base': 'Score must be a number',
    'number.min': 'Score must be at least -1',
    'number.max': 'Score must be at most 1',
    'any.required': 'Score is required'
  })
});
