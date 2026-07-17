'use strict'

const clinicalCases = [
   {
      icdCode: '1D2Z',
      name: 'Dengue',
      description:
         'Infeksi virus dengue yang ditularkan melalui gigitan nyamuk Aedes dan dapat menimbulkan demam akut, trombositopenia, serta kebocoran plasma.',
      variantName: 'Kasus dengue pada dewasa muda',
      clues: [
         {
            type: 'demographic',
            content:
               'Seorang perempuan berusia 24 tahun datang setelah mengalami demam selama empat hari.'
         },
         {
            type: 'history',
            content:
               'Demam muncul mendadak dan disertai nyeri kepala, nyeri di belakang mata, serta pegal pada seluruh tubuh.'
         },
         {
            type: 'symptom',
            content:
               'Pasien mengeluhkan mual, berkurangnya nafsu makan, ruam kemerahan, dan perdarahan ringan pada gusi.'
         },
         {
            type: 'physical_exam',
            content:
               'Suhu tubuh 39°C, ditemukan petekie pada tungkai, dan uji torniket memberikan hasil positif.'
         },
         {
            type: 'diagnostic',
            content:
               'Pemeriksaan laboratorium menunjukkan leukopenia, trombosit 78.000/µL, peningkatan hematokrit, dan antigen NS1 positif.'
         }
      ]
   },
   {
      icdCode: '1F40',
      name: 'Malaria falciparum',
      description:
         'Infeksi parasit Plasmodium falciparum yang ditularkan melalui gigitan nyamuk Anopheles dan dapat berkembang menjadi malaria berat.',
      variantName: 'Kasus malaria setelah perjalanan',
      clues: [
         {
            type: 'demographic',
            content:
               'Seorang laki-laki berusia 31 tahun datang sepuluh hari setelah pulang dari daerah endemis malaria di Papua.'
         },
         {
            type: 'history',
            content:
               'Pasien mengalami demam berulang yang diawali menggigil hebat dan diikuti keringat berlebihan.'
         },
         {
            type: 'symptom',
            content:
               'Keluhan lain berupa nyeri kepala, pegal, mual, dan tubuh terasa sangat lemah.'
         },
         {
            type: 'physical_exam',
            content:
               'Pemeriksaan menunjukkan konjungtiva pucat, suhu 39,2°C, dan pembesaran limpa ringan.'
         },
         {
            type: 'diagnostic',
            content:
               'Sediaan darah tebal dan tipis memperlihatkan parasit Plasmodium falciparum, disertai anemia dan trombositopenia.'
         }
      ]
   },
   {
      icdCode: '5A11',
      name: 'Diabetes melitus tipe 2',
      description:
         'Gangguan metabolik kronis yang ditandai oleh hiperglikemia akibat resistensi insulin dan kekurangan insulin relatif.',
      variantName: 'Kasus hiperglikemia pada dewasa',
      clues: [
         {
            type: 'demographic',
            content:
               'Seorang laki-laki berusia 52 tahun dengan indeks massa tubuh 31 kg/m² datang untuk pemeriksaan.'
         },
         {
            type: 'history',
            content:
               'Selama tiga bulan terakhir pasien lebih sering buang air kecil dan terus merasa haus.'
         },
         {
            type: 'symptom',
            content:
               'Pasien mudah lelah, mengalami penurunan berat badan, dan memiliki riwayat diabetes dalam keluarga.'
         },
         {
            type: 'physical_exam',
            content:
               'Ditemukan akantosis nigrikans pada leher dan tanda dehidrasi ringan tanpa gangguan kesadaran.'
         },
         {
            type: 'diagnostic',
            content:
               'Glukosa darah puasa 186 mg/dL, glukosa darah sewaktu 268 mg/dL, dan HbA1c 8,4%.'
         }
      ]
   },
   {
      icdCode: 'BA00.Z',
      name: 'Hipertensi esensial',
      description:
         'Peningkatan tekanan darah menetap yang tidak disebabkan oleh penyakit sekunder yang dapat diidentifikasi.',
      variantName: 'Kasus tekanan darah tinggi berulang',
      clues: [
         {
            type: 'demographic',
            content:
               'Seorang perempuan berusia 49 tahun datang setelah beberapa kali memperoleh hasil tekanan darah tinggi.'
         },
         {
            type: 'history',
            content:
               'Pasien sering tidak bergejala, tetapi sesekali merasakan sakit kepala pada bagian belakang kepala.'
         },
         {
            type: 'risk_factor',
            content:
               'Pasien memiliki riwayat keluarga dengan tekanan darah tinggi, jarang berolahraga, dan sering mengonsumsi makanan tinggi garam.'
         },
         {
            type: 'physical_exam',
            content:
               'Tekanan darah pada kedua lengan adalah 168/104 mmHg dan tetap tinggi setelah pengukuran ulang dalam keadaan istirahat.'
         },
         {
            type: 'diagnostic',
            content:
               'Fungsi ginjal, elektrolit, dan urinalisis dalam batas normal serta tidak ditemukan tanda penyebab hipertensi sekunder.'
         }
      ]
   },
   {
      icdCode: 'CA40.Z',
      name: 'Pneumonia',
      description:
         'Infeksi jaringan paru yang menyebabkan peradangan alveoli dan dapat menimbulkan demam, batuk, sesak napas, serta infiltrat paru.',
      variantName: 'Kasus infeksi saluran napas bawah',
      clues: [
         {
            type: 'demographic',
            content:
               'Seorang laki-laki berusia 67 tahun datang dengan riwayat merokok selama lebih dari 30 tahun.'
         },
         {
            type: 'history',
            content:
               'Pasien mengalami demam dan batuk berdahak kekuningan sejak tiga hari terakhir.'
         },
         {
            type: 'symptom',
            content:
               'Keluhan disertai sesak napas dan nyeri dada kanan yang bertambah ketika menarik napas dalam.'
         },
         {
            type: 'physical_exam',
            content:
               'Frekuensi napas 28 kali per menit, saturasi oksigen 91%, dan terdengar ronki basah pada lapang paru kanan bawah.'
         },
         {
            type: 'diagnostic',
            content:
               'Darah menunjukkan leukositosis neutrofilik dan foto toraks memperlihatkan konsolidasi pada lobus bawah paru kanan.'
         }
      ]
   }
]

module.exports = {
   clinicalCases
}
