# DP-900 Exam Prep



منصة تفاعلية باللغة العربية للتحضير لشهادة **Microsoft Azure Data Fundamentals (DP-900)**. تجمع بين الدراسة المنظمة، بنك الأسئلة، المحاكي، والمراجعة المبنية على الأخطاء في واجهة RTL متجاوبة.



## المميزات



- Study Hub مقسم إلى ستة محاور: Core Data Concepts، Relational Data، Non-Relational Data، Analytics on Azure، Azure Services Review، وFinal Review.
- 
- بنك أسئلة تفاعلي يضم الأسئلة المرقمة، مع دعم أنواع الاختيار من متعدد وYes/No وHOTSPOT بصيغة مناسبة للويب.
- 
- Exam Simulator، Quick Quiz، DUMP Quiz، Results، Mistakes، وScore Mode.
- 
- Flashcards، Cheat Sheet، Decision Trees، Compare Services، Bookmarks، Analytics، وSpaced Review.
- 
- حفظ تقدم المستخدم والإجابات والأخطاء محلياً في المتصفح دون الحاجة إلى حساب أو API key.
- 
- واجهة عربية RTL، وضع داكن/فاتح، مؤقت للجلسات، حالات loading/empty/error، وتصميم متجاوب.
- 
- تحقق آلي من بنية dump وبنك الأسئلة قبل production build.
- 


> المحتوى تعليمي للمراجعة ولا يمثل أسئلة الامتحان الرسمية أو ضماناً للنجاح. ارجع دائماً إلى [دليل Microsoft الرسمي](https://learn.microsoft.com/credentials/certifications/resources/study-guides/dp-900).
> 


## بنية المستودع



| المسار | الغرض |

| --- | --- |

| `artifacts/dp900-exam-prep` | تطبيق React/Vite الرئيسي |

| `artifacts/dp900-exam-prep/src/pages` | صفحات الدراسة والاختبارات والتحليل |

| `artifacts/dp900-exam-prep/src/components` | مكونات الواجهة القابلة لإعادة الاستخدام |

| `artifacts/dp900-exam-prep/src/data` | بنك الأسئلة وبيانات المحاور والموارد |

| `artifacts/dp900-exam-prep/src/hooks` | منطق الحالة والتقدم والمراجعة |

| `artifacts/dp900-exam-prep/scripts` | أدوات التحقق من البيانات |

| `artifacts/api-server` | مساحة API المشتركة في الـ workspace |

| `.github/workflows` | Workflow النشر إلى GitHub Pages |



## التشغيل المحلي



يتطلب المشروع Node.js حديثاً وpnpm. بعد استنساخ المستودع:



```bash

git clone https://github.com/Fatoomnoour/dp900.git

cd dp900

pnpm install

pnpm --dir artifacts/dp900-exam-prep dev

```



ثم افتح `http://localhost:5173`. ولتشغيل أوامر التحقق والبناء:



```bash

pnpm --dir artifacts/dp900-exam-prep typecheck

pnpm --dir artifacts/dp900-exam-prep validate:dump

pnpm --dir artifacts/dp900-exam-prep validate:source-bank

pnpm --dir artifacts/dp900-exam-prep build

```



## التكوين



التطبيق static ولا يحتاج مفاتيح سرية أو قاعدة بيانات. إذا أضيفت تكاملات مستقبلية، يجب وضع القيم المحلية في ملف `.env.local` وعدم رفعها إلى Git. متغير `BASE_URL` أو إعداد Vite للنشر يجب أن يطابق مسار GitHub Pages `/dp900/`، بينما يعمل التطوير المحلي على `/`.



لا تعدّل ملفات البيانات يدوياً دون تشغيل validator؛ فالـ build مصمم لإيقاف النشر عند وجود answer mapping غير صحيح أو سؤال ناقص الخيارات أو معرفات مكررة.



## GitHub Pages



يتم النشر عبر workflow موجود في `.github/workflows`. عند push إلى `main`، يتم تثبيت الاعتماديات، تشغيل validators، بناء Vite، ثم رفع مجلد `dist` إلى GitHub Pages. رابط الموقع المنشور هو:



<https://fatoomnoour.github.io/dp900/>



إذا ظهر 404 عند فتح مسار داخلي بعد refresh، تأكد من وجود fallback مناسب في إعداد Pages أو استخدم التنقل الداخلي في التطبيق؛ Wouter يعتمد على `BASE_URL` أثناء التشغيل.



## المساهمة



قبل إنشاء Pull Request، شغّل `typecheck` وvalidators و`build`. عند إضافة سؤال، يجب الحفاظ على معرف فريد، خيارات مكتملة، إجابة صحيحة مطابقة لنوع السؤال، وشرح مفيد للمراجعة. لا تضف أسراراً أو ملفات build إلى المستودع.



## الترخيص والمراجع



المستودع يستخدم MIT بحسب إعدادات المشروع. للمفاهيم الرسمية راجع [Microsoft Learn DP-900](https://learn.microsoft.com/credentials/certifications/azure-data-fundamentals/) و[دليل الدراسة الرسمي](https://learn.microsoft.com/credentials/certifications/resources/study-guides/dp-900).







