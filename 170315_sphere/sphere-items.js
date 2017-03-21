function SphereData() {
  
  var sphere_item_classes = {
    1: {
      cls: 1,
      icon: 'icons/ico_1.png',
      link: 'http://google.com/',
      title: 'УПРАВЛЕНИЕ ПРОЦЕССАМИ',
      text: 'Модуль, позволяющий создавать шаблоны документов, автозаполнение, легкое редактирование и полное логирование пользователей.'
    },
    2: {
      cls: 2,
      icon: 'icons/ico_2.png',
      link: 'http://google.com/',
      title: 'УПРАВЛЕНИЕ ДОКУМЕНТАМИ',
      text: 'Автозаполнение, легкое редактирование и полное логирование пользователей.'
    },
    3: {
      cls: 3,
      icon: 'icons/ico_3.png',
      link: 'http://google.com/',
      title: 'СИСТЕМА ХРАНЕНИЯ ДОКУМЕНТОВ',
      text: 'Модуль, позволяющий создавать шаблоны документов.'
    },
    4: {
      cls: 4,
      icon: 'icons/ico_4.png',
      link: 'http://google.com/',
      title: 'УПРАВЛЕНЧЕСКАЯ ОТЧЕТНОСТЬ',
      text: 'Шаблоны документов, автозаполнение, легкое редактирование и полное логирование пользователей.'
    },
    5: {
      cls: 5,
      icon: 'icons/ico_5.png',
      link: 'http://google.com/',
      title: 'УПРАВЛЕНИЕ ОТНОШЕНИЯМИ С КЛИЕНТАМИ',
      text: 'Модуль, позволяющий создавать шаблоны документов, автозаполнение, легкое редактирование, шаблоны документов, автозаполнение, легкое редактирование полное логирование пользователей.'
    },
    6: {
      cls: 6,
      icon: 'icons/ico_6.png',
      link: 'http://google.com/',
      title: 'СТАНЦИЯ СКАНИРОВАНИЯ',
      text: 'Легкое редактирование и полное логирование пользователей.'
    },
    7: {
      cls: 7,
      icon: 'icons/ico_7.png',
      link: 'http://google.com/',
      title: 'УПРАВЛЕНИЕ ПРОЦЕССАМИ',
      text: 'Модуль, позволяющий создавать шаблоны документов, автозаполнение, легкое редактирование и полное логирование пользователей.'
    },
    8: {
      cls: 8,
      icon: 'icons/ico_8.png',
      link: 'http://google.com/',
      title: 'УПРАВЛЕНЧЕСКАЯ ОТЧЕТНОСТЬ',
      text: 'Модуль, позволяющий создавать шаблоны документов, автозаполнение, легкое редактирование и полное логирование пользователей.'
    },
  }

  function copyObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  this.onclick = function(item, i) {
    alert('Нажата вершина с номером ' + i);
    // window.location.href = item.link;
  }
  
  this.menu = [
    {
      title: 'Управление\nпроцессами',
      cls: 1,
      angle: Math.PI / 3,
      align: 'left',
    }, {
      title: 'Управление\nдокументами',
      cls: 2,
      angle: 0,
      align: 'left',
    }, {
      title: 'Система хранения\nэл. документов',
      cls: 3,
      angle: -Math.PI / 3,
      align: 'left',
    }, {
      title: 'Управленческая\nотчетность',
      cls: 4,
      angle: - 2 * Math.PI / 3,
      align: 'right',
    }, {
      title: 'Управление\nотношениями\nс клиентами',
      cls: 5,
      angle: - Math.PI,
      align: 'right',
    }, {
      title: 'Станция\nсканирования',
      cls: 6,
      angle: Math.PI * 2 / 3,
      align: 'right',
    } 
  ]

  this.items = {
    0: copyObj(sphere_item_classes[5]),
    1: copyObj(sphere_item_classes[1]),
    2: copyObj(sphere_item_classes[2]),
    3: copyObj(sphere_item_classes[3]),
    4: copyObj(sphere_item_classes[4]),
    5: copyObj(sphere_item_classes[5]),
    6: copyObj(sphere_item_classes[6]),
    7: copyObj(sphere_item_classes[7]),
    8: copyObj(sphere_item_classes[8]),
    9: copyObj(sphere_item_classes[4]),
    10: copyObj(sphere_item_classes[5]),
    11: copyObj(sphere_item_classes[1]),
    12: copyObj(sphere_item_classes[2]),
    13: copyObj(sphere_item_classes[3]),
    14: copyObj(sphere_item_classes[4]),
    15: copyObj(sphere_item_classes[5]),
    16: copyObj(sphere_item_classes[6]),
    17: copyObj(sphere_item_classes[7]),
    18: copyObj(sphere_item_classes[8]),
    19: copyObj(sphere_item_classes[4]),
    20: copyObj(sphere_item_classes[5]),
    21: copyObj(sphere_item_classes[1]),
    22: copyObj(sphere_item_classes[2]),
    23: copyObj(sphere_item_classes[3]),
    24: copyObj(sphere_item_classes[4]),
    25: copyObj(sphere_item_classes[5]),
    26: copyObj(sphere_item_classes[6]),
    27: copyObj(sphere_item_classes[7]),
    28: copyObj(sphere_item_classes[8]),
    29: copyObj(sphere_item_classes[4]),
    30: copyObj(sphere_item_classes[5]),
    31: copyObj(sphere_item_classes[1]),
    32: copyObj(sphere_item_classes[2]),
    33: copyObj(sphere_item_classes[3]),
    34: copyObj(sphere_item_classes[4]),
    35: copyObj(sphere_item_classes[5]),
    36: copyObj(sphere_item_classes[6]),
    37: copyObj(sphere_item_classes[7]),
    38: copyObj(sphere_item_classes[8]),
    39: copyObj(sphere_item_classes[4]),
    40: copyObj(sphere_item_classes[5]),
    41: copyObj(sphere_item_classes[1]),
  }
}
