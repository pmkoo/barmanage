
module.exports = (sequelize, DataTypes) => {
  var Feedback = sequelize.define('Feedback', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    barID: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    content: {
      type: DataTypes.STRING
    },
    updatedAt: {
      type: DataTypes.DATE
    },
    createdAt: {
      type: DataTypes.DATE
    }
  }, {
    classMethods: {
      associate: (models) => {
        Feedback.belongsTo(models.Bar)
      }
    }
  })

  return Feedback
}