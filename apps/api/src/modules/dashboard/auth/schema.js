const { z } = require('zod')

const LoginSchema = z.object({
   email: z.email('Email format tidak valid').min(1, 'Email tidak boleh kosong'),
   password: z.string().min(1, 'Password tidak boleh kosong')
})

const ChangePasswordSchema = z
   .object({
      old_password: z.string().min(1, 'Password lama tidak boleh kosong'),
      new_password: z
         .string()
         .min(8, 'Password baru minimal 8 karakter')
         .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password harus mengandung huruf kecil, huruf besar, dan angka'
         ),
      confirm_password: z
         .string()
         .min(1, 'Konfirmasi password tidak boleh kosong')
   })
   .refine((data) => data.new_password === data.confirm_password, {
      message: 'Password baru dan konfirmasi password tidak cocok',
      path: ['confirm_password']
   })

module.exports = {
   LoginSchema,
   ChangePasswordSchema
}
