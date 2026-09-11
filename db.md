INSERT INTO public.product (name_th,name_en,desc_th,desc_en,price_hot,price_iced,image_url,is_combo,is_available,is_sold_out,is_recommended,sort_order,created_at,updated_at) VALUES
	 ('น้ำเต้าหู้ชมพู','Nom Yen Soy Milk','','Salak (Snake Fruit)',30,35,'',false,true,false,false,3,'2026-09-10 13:12:37.693623+07','2026-09-10 13:38:15.185181+07'),
	 ('น้ำเต้าหู้ช๊อคโก','Choco Soy Milk','','',30,35,'',false,true,false,false,4,'2026-09-10 13:13:32.628892+07','2026-09-10 13:38:15.186162+07'),
	 ('น้ำเต้าหู้มัทฉะ','Matcha Soy Milk','','',35,40,'',false,true,false,false,5,'2026-09-10 13:02:03.644054+07','2026-09-10 13:38:15.187011+07'),
	 ('น้ำเต้าหู้ชาไทย','Thai Tea Soy Milk','','',30,35,'',false,true,false,false,2,'2026-09-10 13:03:25.61689+07','2026-09-10 15:04:31.604442+07'),
	 ('น้ำเต้าหู้','Original Soy Milk','อร่อยจุง','Delicious',25,30,'',false,true,false,false,1,'2026-09-10 12:56:52.138262+07','2026-09-10 15:13:37.86433+07'),
	 ('Test Combo','','','',30,35,'',true,true,false,false,6,'2026-09-10 15:40:57.981302+07','2026-09-10 16:01:58.9349+07'),
	 ('asd','','','',30,35,'',true,true,false,false,7,'2026-09-10 16:02:20.959683+07','2026-09-10 16:02:20.959683+07');

INSERT INTO public.topping (name_th,name_en,price,allow_hot,allow_iced,image_url,is_available,is_sold_out,sort_order,created_at,updated_at) VALUES
     ('ไข่มุกบราวน์ชูการ์','Brown Sugar Boba',10,false,true,'',true,false,1,'2026-09-10 14:41:28.564368+07','2026-09-10 14:51:23.967378+07'),
     ('เม็ดแมงลัก','',10,true,true,'',true,false,2,'2026-09-10 14:53:10.485773+07','2026-09-10 14:53:10.485773+07'),
     ('เมล็ดเจีย','',10,true,true,'',true,false,3,'2026-09-10 14:53:21.349011+07','2026-09-10 14:53:21.349011+07'),
     ('สาคู','',10,true,true,'',true,false,4,'2026-09-10 14:54:04.659887+07','2026-09-10 14:54:04.659887+07'),
     ('เฉาก๊วย','',10,false,true,'',true,false,5,'2026-09-10 14:54:13.983566+07','2026-09-10 14:54:17.928395+07'),
     ('ถั่วแดง','Red Bean',10,true,true,'',true,false,6,'2026-09-10 14:56:48.723372+07','2026-09-10 14:56:48.723372+07');