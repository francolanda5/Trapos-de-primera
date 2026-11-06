-- Marcar a una persona como administradora.
-- Primero tiene que haber iniciado sesión al menos una vez en la web (así se crea su perfil).
-- Cambiá el correo por el de esa persona y ejecutalo en Supabase > SQL Editor.
update public.profiles
   set role = 'admin'
 where email = 'CORREO_DEL_ADMINISTRADOR@gmail.com';

-- Para comprobarlo:
-- select email, role from public.profiles;
